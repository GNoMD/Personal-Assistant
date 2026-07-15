import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

function rowToSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    previousResponseId: row.previous_response_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preview: row.preview || '',
    messageCount: row.message_count ?? undefined,
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content || '',
    action: row.action_json ? JSON.parse(row.action_json) : null,
    error: row.error || null,
    createdAt: row.created_at,
  };
}

function titleFromMessage(message) {
  const text = String(message || '').replace(/\s+/g, ' ').trim();
  if (!text) return '新对话';
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

export function createAssistantSession(userId, title = '新对话') {
  const id = randomUUID();
  getDb().prepare(`
    INSERT INTO assistant_sessions (id, user_id, title)
    VALUES (?, ?, ?)
  `).run(id, userId, title);
  return getOwnedSession(id, userId);
}

export function getOwnedSession(sessionId, userId) {
  const row = getDb().prepare(`
    SELECT * FROM assistant_sessions WHERE id = ? AND user_id = ?
  `).get(sessionId, userId);
  return rowToSession(row);
}

export function listAssistantSessions(userId, limit = 50) {
  const rows = getDb().prepare(`
    SELECT
      s.*,
      (
        SELECT m.content FROM assistant_messages m
        WHERE m.session_id = s.id AND m.role = 'user'
        ORDER BY m.created_at ASC
        LIMIT 1
      ) AS preview,
      (
        SELECT COUNT(*) FROM assistant_messages m WHERE m.session_id = s.id
      ) AS message_count
    FROM assistant_sessions s
    WHERE s.user_id = ?
    ORDER BY s.updated_at DESC
    LIMIT ?
  `).all(userId, Math.min(100, Math.max(1, Number(limit) || 50)));
  return rows.map(rowToSession);
}

export function getAssistantSessionDetail(sessionId, userId) {
  const session = getOwnedSession(sessionId, userId);
  if (!session) return null;
  const messages = getDb().prepare(`
    SELECT * FROM assistant_messages
    WHERE session_id = ? AND user_id = ?
    ORDER BY created_at ASC, rowid ASC
  `).all(sessionId, userId).map(rowToMessage);
  return { ...session, messages };
}

export function deleteAssistantSession(sessionId, userId) {
  const db = getDb();
  const existing = getOwnedSession(sessionId, userId);
  if (!existing) return false;
  const remove = db.transaction(() => {
    db.prepare('UPDATE assistant_actions SET session_id = NULL WHERE session_id = ? AND user_id = ?')
      .run(sessionId, userId);
    db.prepare('DELETE FROM assistant_messages WHERE session_id = ? AND user_id = ?')
      .run(sessionId, userId);
    db.prepare('DELETE FROM assistant_sessions WHERE id = ? AND user_id = ?')
      .run(sessionId, userId);
  });
  remove();
  return true;
}

export function ensureAssistantSession(sessionId, userId) {
  if (sessionId) {
    const existing = getOwnedSession(sessionId, userId);
    if (!existing) throw new Error('会话不存在或无权访问');
    return existing;
  }
  return createAssistantSession(userId);
}

export function appendAssistantMessage({
  sessionId,
  userId,
  role,
  content = '',
  action = null,
  error = null,
  messageId = null,
}) {
  const id = messageId || randomUUID();
  getDb().prepare(`
    INSERT INTO assistant_messages (
      id, session_id, user_id, role, content, action_json, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    sessionId,
    userId,
    role,
    String(content || ''),
    action ? JSON.stringify(action) : null,
    error || null
  );
  getDb().prepare(`
    UPDATE assistant_sessions
    SET updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(sessionId, userId);
  return id;
}

export function updateAssistantMessage(messageId, userId, fields) {
  const updates = [];
  const params = { id: messageId, userId };
  if (fields.content !== undefined) {
    updates.push('content = @content');
    params.content = String(fields.content || '');
  }
  if (fields.action !== undefined) {
    updates.push('action_json = @action');
    params.action = fields.action ? JSON.stringify(fields.action) : null;
  }
  if (fields.error !== undefined) {
    updates.push('error = @error');
    params.error = fields.error || null;
  }
  if (!updates.length) return;
  getDb().prepare(`
    UPDATE assistant_messages
    SET ${updates.join(', ')}
    WHERE id = @id AND user_id = @userId
  `).run(params);
}

/** Delete one owned message bubble. Returns sessionId when successful. */
export function deleteAssistantMessage(messageId, userId) {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id FROM assistant_messages
    WHERE id = ? AND user_id = ?
  `).get(messageId, userId);
  if (!row) return null;

  const remove = db.transaction(() => {
    db.prepare('DELETE FROM assistant_messages WHERE id = ? AND user_id = ?')
      .run(messageId, userId);
    db.prepare(`
      UPDATE assistant_sessions
      SET updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(row.session_id, userId);

    const remaining = db.prepare(`
      SELECT COUNT(*) AS n FROM assistant_messages
      WHERE session_id = ? AND user_id = ?
    `).get(row.session_id, userId).n;
    if (remaining === 0) {
      db.prepare('DELETE FROM assistant_sessions WHERE id = ? AND user_id = ?')
        .run(row.session_id, userId);
      return { sessionId: row.session_id, sessionDeleted: true };
    }
    return { sessionId: row.session_id, sessionDeleted: false };
  });
  return remove();
}

export function updateMessageActionStatus(sessionId, userId, actionId, status) {
  const rows = getDb().prepare(`
    SELECT id, action_json FROM assistant_messages
    WHERE session_id = ? AND user_id = ? AND action_json IS NOT NULL
  `).all(sessionId, userId);
  for (const row of rows) {
    let action;
    try {
      action = JSON.parse(row.action_json);
    } catch {
      continue;
    }
    if (action?.id !== actionId) continue;
    getDb().prepare(`
      UPDATE assistant_messages
      SET action_json = ?
      WHERE id = ? AND user_id = ?
    `).run(JSON.stringify({ ...action, status }), row.id, userId);
  }
}

export function touchSessionTitleFromFirstUserMessage(sessionId, userId, message) {
  const session = getOwnedSession(sessionId, userId);
  if (!session || session.title !== '新对话') return;
  getDb().prepare(`
    UPDATE assistant_sessions
    SET title = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(titleFromMessage(message), sessionId, userId);
}

export function setSessionPreviousResponseId(sessionId, userId, previousResponseId) {
  getDb().prepare(`
    UPDATE assistant_sessions
    SET previous_response_id = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(previousResponseId || null, sessionId, userId);
}
