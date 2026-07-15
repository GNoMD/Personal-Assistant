import { getDb } from '../db.js';

/** Soft budget before we proactively rotate the fixed OpenClaw window. */
const DEFAULT_CONTEXT_CHAR_LIMIT = Number(process.env.OPENCLAW_CONTEXT_CHAR_LIMIT) || 120_000;

export function openClawSessionKey(userId, windowGen = 1) {
  return `taskplanner-user-${userId}-w${Number(windowGen) || 1}`;
}

function rowToWindow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    windowGen: row.window_gen,
    previousResponseId: row.previous_response_id || null,
    approxChars: row.approx_chars || 0,
    sessionKey: openClawSessionKey(row.user_id, row.window_gen),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rotatedAt: row.rotated_at || null,
  };
}

/** One fixed OpenClaw window per user; reused until context rotates. */
export function getOrCreateOpenClawWindow(userId) {
  const db = getDb();
  let row = db.prepare('SELECT * FROM assistant_openclaw_windows WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare(`
      INSERT INTO assistant_openclaw_windows (user_id, window_gen, approx_chars)
      VALUES (?, 1, 0)
    `).run(userId);
    row = db.prepare('SELECT * FROM assistant_openclaw_windows WHERE user_id = ?').get(userId);
  }
  return rowToWindow(row);
}

export function isContextOverflowError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('context')
    || message.includes('token')
    || message.includes('too long')
    || message.includes('maximum context')
    || message.includes('context_length')
    || message.includes('overcrowded')
    || message.includes('上下文')
    || message.includes('长度超限')
  );
}

export function shouldRotateOpenClawWindow(window, addedChars = 0) {
  const limit = DEFAULT_CONTEXT_CHAR_LIMIT;
  return (Number(window?.approxChars) || 0) + Number(addedChars || 0) >= limit;
}

/** Start a new OpenClaw window for this user; keep the user fixed, bump generation only. */
export function rotateOpenClawWindow(userId, reason = 'context_full') {
  const db = getDb();
  const current = getOrCreateOpenClawWindow(userId);
  const nextGen = current.windowGen + 1;
  db.prepare(`
    UPDATE assistant_openclaw_windows
    SET window_gen = ?,
        previous_response_id = NULL,
        approx_chars = 0,
        rotated_at = datetime('now'),
        updated_at = datetime('now')
    WHERE user_id = ?
  `).run(nextGen, userId);
  const window = getOrCreateOpenClawWindow(userId);
  return { ...window, rotatedReason: reason };
}

export function recordOpenClawTurn(userId, {
  previousResponseId = null,
  addedChars = 0,
} = {}) {
  const db = getDb();
  getOrCreateOpenClawWindow(userId);
  db.prepare(`
    UPDATE assistant_openclaw_windows
    SET previous_response_id = COALESCE(?, previous_response_id),
        approx_chars = approx_chars + ?,
        updated_at = datetime('now')
    WHERE user_id = ?
  `).run(previousResponseId || null, Math.max(0, Number(addedChars) || 0), userId);
  return getOrCreateOpenClawWindow(userId);
}

export function estimateTurnChars(input, outputText = '') {
  const inputText = typeof input === 'string'
    ? input
    : JSON.stringify(input || '');
  return String(inputText).length + String(outputText || '').length;
}
