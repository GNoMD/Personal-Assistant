import { getDb } from '../db.js';

function taskSnapshot(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    category: row.category,
    time: row.time,
    description: row.description,
    durationLabel: row.duration_label,
    durationMinutes: row.duration_minutes,
    completed: Boolean(row.completed),
    sortOrder: row.sort_order,
  };
}

export function logTaskAction({ userId, taskId, action, beforeRow, afterRow, changes }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO task_audit_log (task_id, user_id, action, snapshot, changes)
    VALUES (@taskId, @userId, @action, @snapshot, @changes)
  `).run({
    taskId: taskId ?? null,
    userId,
    action,
    snapshot: JSON.stringify(taskSnapshot(afterRow) || taskSnapshot(beforeRow)),
    changes: changes ? JSON.stringify(changes) : null,
  });
}

export function getTaskAuditLog(taskId, userId) {
  const db = getDb();
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) return null;
  return db.prepare(`
    SELECT a.id, a.task_id as taskId, a.user_id as userId, u.username,
           a.action, a.snapshot, a.changes, a.created_at as createdAt
    FROM task_audit_log a
    JOIN users u ON u.id = a.user_id
    WHERE a.task_id = ?
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all(taskId).map((r) => ({
    ...r,
    snapshot: JSON.parse(r.snapshot),
    changes: r.changes ? JSON.parse(r.changes) : null,
  }));
}

export function getUserRecentAudit(userId, limit = 30) {
  return getDb().prepare(`
    SELECT a.id, a.task_id as taskId, a.action, a.snapshot, a.changes, a.created_at as createdAt
    FROM task_audit_log a
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(userId, limit).map((r) => ({
    ...r,
    snapshot: JSON.parse(r.snapshot),
    changes: r.changes ? JSON.parse(r.changes) : null,
  }));
}
