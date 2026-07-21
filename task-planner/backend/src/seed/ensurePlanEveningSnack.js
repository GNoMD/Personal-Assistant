/**
 * 幂等写入「练后轻夜宵」计划任务（按 plan_day · night-snack-dN）。
 */
import { getDb } from '../db.js';
import { planDayForDate } from './planData.js';
import { planEveningSnackTaskFields } from './eveningSnackRecipes.js';

const MIGRATION_ID = 'plan_evening_snack_v1';

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function isEveningSnackRow(row) {
  const key = row.templateKey || row.template_key || '';
  const title = row.title || '';
  return row.category === '夜宵'
    || key.startsWith('night-snack-')
    || title.includes('练后轻夜宵');
}

/**
 * @param {{ force?: boolean, database?: import('better-sqlite3').Database }} [options]
 */
export function ensurePlanEveningSnack(options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) {
      const refreshed = syncEveningSnackContent(database);
      return { applied: false, reason: 'already_applied', refreshed };
    }
  }

  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  const hasTemplateKey = cols.includes('template_key');

  const days = database
    .prepare(`
      SELECT DISTINCT user_id AS userId, date, plan_day AS planDay, plan_name AS planName
      FROM tasks
      WHERE user_id IS NOT NULL
      ORDER BY user_id, date
    `)
    .all();

  const existsStmt = database.prepare(`
    SELECT id FROM tasks
    WHERE user_id = ?
      AND date = ?
      AND (
        category = '夜宵'
        OR template_key LIKE 'night-snack-%'
        OR title LIKE '练后轻夜宵%'
      )
    LIMIT 1
  `);

  const insert = hasTemplateKey
    ? database.prepare(`
        INSERT INTO tasks (
          user_id, date, plan_day, plan_name, time, category, title, description,
          duration_label, duration_minutes, template_key, completed, sort_order
        ) VALUES (
          @userId, @date, @planDay, @planName, @time, @category, @title, @description,
          @durationLabel, @durationMinutes, @templateKey, 0, @sortOrder
        )
      `)
    : database.prepare(`
        INSERT INTO tasks (
          user_id, date, plan_day, plan_name, time, category, title, description,
          duration_label, duration_minutes, completed, sort_order
        ) VALUES (
          @userId, @date, @planDay, @planName, @time, @category, @title, @description,
          @durationLabel, @durationMinutes, 0, @sortOrder
        )
      `);

  const maxSortStmt = database.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) AS m FROM tasks WHERE user_id = ? AND date = ?'
  );

  let inserted = 0;
  database.transaction(() => {
    for (const row of days) {
      const planDay = row.planDay || planDayForDate(row.date);
      if (!planDay) continue;
      if (existsStmt.get(row.userId, row.date)) continue;

      const snack = planEveningSnackTaskFields(planDay);
      const sortOrder = Number(maxSortStmt.get(row.userId, row.date).m) + 1;
      const payload = {
        userId: row.userId,
        date: row.date,
        planDay,
        planName: row.planName || '',
        time: '20:30',
        category: snack.category,
        title: snack.title,
        description: snack.description,
        durationLabel: snack.durationLabel || '',
        durationMinutes: snack.durationMinutes,
        sortOrder,
      };
      if (hasTemplateKey) payload.templateKey = snack.templateKey;
      insert.run(payload);
      inserted += 1;
    }
    database.prepare('INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime(\'now\'))')
      .run(MIGRATION_ID);
  })();

  const refreshed = syncEveningSnackContent(database);
  return { applied: true, dates: days.length, inserted, refreshed };
}

export function syncEveningSnackContent(database = getDb()) {
  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!cols.includes('template_key')) return 0;

  const rows = database.prepare(`
    SELECT id, date, plan_day AS planDay, title, category, template_key AS templateKey
    FROM tasks
    WHERE category = '夜宵'
       OR template_key LIKE 'night-snack-%'
       OR title LIKE '练后轻夜宵%'
  `).all();

  const update = database.prepare(`
    UPDATE tasks
    SET title = @title,
        description = @description,
        category = '夜宵',
        template_key = @templateKey,
        duration_label = @durationLabel,
        duration_minutes = @durationMinutes,
        time = '20:30',
        updated_at = datetime('now')
    WHERE id = @id
  `);

  let updated = 0;
  database.transaction(() => {
    for (const row of rows) {
      if (!isEveningSnackRow(row)) continue;
      const planDay = row.planDay || planDayForDate(row.date);
      if (!planDay) continue;
      const content = planEveningSnackTaskFields(planDay);
      const result = update.run({
        id: row.id,
        title: content.title,
        description: content.description,
        templateKey: content.templateKey,
        durationLabel: content.durationLabel || '',
        durationMinutes: content.durationMinutes,
      });
      updated += result.changes || 0;
    }
  })();
  return updated;
}
