import { Router } from 'express';
import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { planDayForDate, getTasksForPlanDay, PLAN_META, isHairCarePlanUsername } from '../seed/planData.js';
import { inferDuration } from '../seed/durationMap.js';
import { requireAuth } from '../middleware/auth.js';
import { logTaskAction } from '../services/audit.js';
import { emitToUser } from '../socket.js';
import { seedUserTasks } from '../seed/seed.js';
import { seedSharedRecipeLibrary } from '../seed/seedRecipes.js';

const router = Router();
router.use(requireAuth);

function getRecipeIdByTemplateKey(db, templateKey) {
  if (!templateKey) return null;
  const libraryUserId = ensureRecipeLibraryUser(db);
  const row = db.prepare(
    'SELECT id FROM recipes WHERE user_id = ? AND template_key = ?'
  ).get(libraryUserId, templateKey);
  return row ? row.id : null;
}

function rowToTask(row, recipeIdByKey = null) {
  const templateKey = row.template_key || '';
  let recipeId = null;
  if (templateKey) {
    if (recipeIdByKey) recipeId = recipeIdByKey.get(templateKey) || null;
    else recipeId = getRecipeIdByTemplateKey(getDb(), templateKey);
  }

  const task = {
    id: row.id,
    date: row.date,
    planDay: row.plan_day,
    planName: row.plan_name,
    time: row.time,
    category: row.category,
    title: row.title,
    description: row.description,
    durationLabel: row.duration_label || '',
    durationMinutes: row.duration_minutes ?? null,
    templateKey: templateKey || null,
    recipeId,
    completed: Boolean(row.completed),
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
  if (!task.durationLabel) {
    const d = inferDuration(task.title, task.category, task.planDay);
    task.durationLabel = d.durationLabel;
    task.durationMinutes = d.durationMinutes;
  }
  return task;
}

function loadRecipeIdMap(db) {
  const libraryUserId = ensureRecipeLibraryUser(db);
  const rows = db.prepare(
    `SELECT id, template_key FROM recipes
     WHERE user_id = ? AND template_key IS NOT NULL AND template_key != ''`
  ).all(libraryUserId);
  return new Map(rows.map((r) => [r.template_key, r.id]));
}

function getOwnedTask(db, taskId, userId) {
  return db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
}

function sync(userId, type, payload) {
  emitToUser(userId, 'task:sync', { type, ...payload, at: Date.now() });
}

function insertTaskRow(db, {
  userId, date, planDay, planName, time, category, title, description,
  durationLabel, durationMinutes, templateKey, sortOrder,
}) {
  return db.prepare(`
    INSERT INTO tasks (
      user_id, date, plan_day, plan_name, time, category, title, description,
      duration_label, duration_minutes, template_key, completed, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    userId, date, planDay, planName, time || '', category, title, description || '',
    durationLabel || '',
    durationMinutes ?? null,
    templateKey || null,
    sortOrder
  );
}

/** GET /api/tasks?date=2026-07-01 */
router.get('/', (req, res) => {
  const { date } = req.query;
  const userId = req.user.id;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date query required (YYYY-MM-DD)' });
  }

  seedSharedRecipeLibrary();
  const db = getDb();
  let rows = db.prepare(
    'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY sort_order ASC'
  ).all(userId, date);

  if (rows.length === 0 && planDayForDate(date) !== null) {
    const hadTasks = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id = ?').get(userId).c > 0;
    if (!hadTasks) seedUserTasks(userId);
    rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY sort_order ASC'
    ).all(userId, date);

    if (rows.length === 0) {
      const planDay = planDayForDate(date);
      const includeHairCare = isHairCarePlanUsername(req.user.username);
      const templates = getTasksForPlanDay(planDay, { includeHairCare });
      const create = db.transaction(() => {
        for (const t of templates) {
          insertTaskRow(db, {
            userId,
            date,
            planDay: t.planDay,
            planName: t.planName,
            time: t.time,
            category: t.category,
            title: t.title,
            description: t.description,
            durationLabel: t.durationLabel || '',
            durationMinutes: t.durationMinutes ?? null,
            templateKey: t.templateKey || null,
            sortOrder: t.sortOrder,
          });
        }
      });
      create();
      rows = db.prepare(
        'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY sort_order ASC'
      ).all(userId, date);
    }
  }

  const planDay = planDayForDate(date);
  const meta = planDay ? PLAN_META[planDay - 1] : null;
  const recipeMap = loadRecipeIdMap(db);

  res.json({
    date,
    planDay,
    planMeta: meta,
    tasks: rows.map((row) => rowToTask(row, recipeMap)),
    progress: {
      total: rows.length,
      completed: rows.filter((r) => r.completed === 1).length,
    },
  });
});

/** GET /api/tasks/calendar?year=2026&month=7 */
router.get('/calendar', (req, res) => {
  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10);
  const userId = req.user.id;
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'year and month required' });
  }

  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const db = getDb();
  const rows = db.prepare(`
    SELECT date, COUNT(*) as total, SUM(completed) as completed
    FROM tasks WHERE user_id = ? AND date LIKE ?
    GROUP BY date ORDER BY date
  `).all(userId, `${prefix}%`);

  const highlightRows = db.prepare(`
    SELECT date, title, category, time, sort_order
    FROM tasks
    WHERE user_id = ? AND date LIKE ?
    ORDER BY date,
      CASE category
        WHEN '早餐' THEN 0
        WHEN '运动' THEN 1
        WHEN '护理' THEN 2
        WHEN '旅行' THEN 3
        ELSE 4
      END,
      CASE WHEN time IS NULL OR time = '' THEN 1 ELSE 0 END,
      time ASC,
      sort_order ASC
  `).all(userId, `${prefix}%`);

  const highlightsByDate = {};
  for (const row of highlightRows) {
    if (!highlightsByDate[row.date]) highlightsByDate[row.date] = [];
    if (highlightsByDate[row.date].length >= 2) continue;
    highlightsByDate[row.date].push({
      title: row.title,
      category: row.category,
    });
  }

  res.json({
    year,
    month,
    days: rows.map((r) => ({
      date: r.date,
      total: r.total,
      completed: r.completed || 0,
      highlights: highlightsByDate[r.date] || [],
    })),
  });
});

/** GET /api/tasks/:id */
router.get('/:id', (req, res) => {
  seedSharedRecipeLibrary();
  const row = getOwnedTask(getDb(), req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Task not found' });
  res.json(rowToTask(row));
});

/** POST /api/tasks */
router.post('/', (req, res) => {
  const userId = req.user.id;
  const {
    date, category, title, description, time, durationLabel, durationMinutes, templateKey,
  } = req.body;
  if (!date || !category || !title) {
    return res.status(400).json({ error: 'date, category, title required' });
  }
  if (category === '早餐' && !templateKey) {
    return res.status(400).json({ error: '早餐任务必须关联食谱库（请选择早餐食谱）' });
  }
  const planDay = planDayForDate(date);
  if (planDay === null) return res.status(400).json({ error: 'date before plan start' });

  seedSharedRecipeLibrary();
  const db = getDb();
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) as m FROM tasks WHERE user_id = ? AND date = ?'
  ).get(userId, date).m;

  const meta = PLAN_META[planDay - 1];
  const inferred = inferDuration(title, category, planDay);
  const result = insertTaskRow(db, {
    userId,
    date,
    planDay,
    planName: meta.name,
    time: time || '',
    category,
    title,
    description: description || '',
    durationLabel: durationLabel || inferred.durationLabel || '',
    durationMinutes: durationMinutes ?? inferred.durationMinutes ?? null,
    templateKey: templateKey || null,
    sortOrder: maxOrder + 1,
  });

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  logTaskAction({ userId, taskId: row.id, action: 'create', afterRow: row });
  const task = rowToTask(row);
  sync(userId, 'create', { task, date });
  res.status(201).json(task);
});

/** PATCH /api/tasks/:id */
router.patch('/:id', (req, res) => {
  const userId = req.user.id;
  const db = getDb();
  const existing = getOwnedTask(db, req.params.id, userId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const {
    completed, title, description, category, time, durationLabel, durationMinutes, templateKey,
  } = req.body;
  const updates = [];
  const params = { id: req.params.id };
  const changes = {};

  const nextCategory = category !== undefined ? category : existing.category;
  const nextTemplateKey = templateKey !== undefined ? templateKey : existing.template_key;
  if (nextCategory === '早餐' && !nextTemplateKey) {
    return res.status(400).json({ error: '早餐任务必须关联食谱库（请选择早餐食谱）' });
  }

  const fields = [
    ['completed', completed, (v) => (v ? 1 : 0)],
    ['title', title, (v) => v],
    ['description', description, (v) => v],
    ['category', category, (v) => v],
    ['time', time, (v) => v],
    ['duration_label', durationLabel, (v) => v],
    ['duration_minutes', durationMinutes, (v) => v],
    ['template_key', templateKey, (v) => v || null],
  ];

  for (const [col, val, transform] of fields) {
    if (val !== undefined) {
      const key = col === 'duration_label'
        ? 'durationLabel'
        : col === 'duration_minutes'
          ? 'durationMinutes'
          : col === 'template_key'
            ? 'templateKey'
            : col;
      updates.push(`${col} = @${key}`);
      params[key] = transform(val);
      changes[col] = { from: existing[col], to: params[key] };
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = @id`).run(params);

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  const action = completed !== undefined ? 'complete' : 'update';
  logTaskAction({ userId, taskId: row.id, action, beforeRow: existing, afterRow: row, changes });
  const task = rowToTask(row);
  sync(userId, 'update', { task, date: task.date });
  res.json(task);
});

/** DELETE /api/tasks/:id */
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const db = getDb();
  const existing = getOwnedTask(db, req.params.id, userId);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  logTaskAction({ userId, taskId: existing.id, action: 'delete', beforeRow: existing });
  sync(userId, 'delete', { id: existing.id, date: existing.date });
  res.json({ deleted: true, id: Number(req.params.id) });
});

export default router;
