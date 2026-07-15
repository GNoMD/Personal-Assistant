/**
 * 为所有已有日历用户幂等写入「下午茶」计划任务（按 plan_day 挂 afternoon-tea-dN）。
 */
import { getDb } from '../db.js';
import { planDayForDate } from './planData.js';
import { planAfternoonTeaTaskFields } from './afternoonTeaRecipes.js';

const MIGRATION_ID = 'plan_afternoon_tea_v1';

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * @param {{ force?: boolean, database?: import('better-sqlite3').Database }} [options]
 */
export function ensurePlanAfternoonTea(options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) return { applied: false, reason: 'already_applied' };
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
        category = '下午茶'
        OR template_key LIKE 'afternoon-tea-%'
        OR title LIKE '下午茶%'
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

      const tea = planAfternoonTeaTaskFields(planDay);
      const isWeekend = planDay === 6 || planDay === 7;
      const sortOrder = Number(maxSortStmt.get(row.userId, row.date).m) + 1;
      const payload = {
        userId: row.userId,
        date: row.date,
        planDay,
        planName: row.planName || '',
        time: isWeekend ? '16:00' : '15:30',
        category: tea.category,
        title: tea.title,
        description: tea.description,
        durationLabel: tea.durationLabel || '',
        durationMinutes: tea.durationMinutes,
        sortOrder,
      };
      if (hasTemplateKey) payload.templateKey = tea.templateKey;
      insert.run(payload);
      inserted += 1;
    }
    database.prepare('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)').run(MIGRATION_ID);
  })();

  const refreshed = syncAfternoonTeaContent(database);
  return { applied: true, dates: days.length, inserted, refreshed };
}

/** 已存在的下午茶任务按模板刷新文案 */
export function syncAfternoonTeaContent(database = getDb()) {
  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!cols.includes('template_key')) return 0;

  const update = database.prepare(`
    UPDATE tasks
    SET title = @title,
        description = @description,
        category = '下午茶',
        template_key = @templateKey,
        duration_label = @durationLabel,
        duration_minutes = @durationMinutes,
        updated_at = datetime('now')
    WHERE plan_day = @planDay
      AND (
        category = '下午茶'
        OR template_key = @templateKey
        OR title LIKE '下午茶%'
      )
  `);

  let updated = 0;
  database.transaction(() => {
    for (let day = 1; day <= 7; day += 1) {
      const content = planAfternoonTeaTaskFields(day);
      const result = update.run({
        title: content.title,
        description: content.description,
        templateKey: content.templateKey,
        durationLabel: content.durationLabel || '',
        durationMinutes: content.durationMinutes,
        planDay: day,
      });
      updated += result.changes || 0;
    }
  })();
  return updated;
}
