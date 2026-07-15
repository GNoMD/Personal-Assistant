/**
 * 为所有已有日历用户幂等写入「午餐 / 晚餐」计划任务。
 */
import { getDb } from '../db.js';
import { planDayForDate } from './planData.js';
import { planDinnerTaskFields, planLunchTaskFields } from './planMeals.js';

const MIGRATION_ID = 'plan_lunch_dinner_v1';

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function mealTime(kind, planDay) {
  const isWeekend = planDay === 6 || planDay === 7;
  if (kind === 'lunch') return isWeekend ? '12:00' : '12:00';
  return isWeekend ? '18:00' : '18:00';
}

function ensureMealSlots({
  database,
  kind,
  category,
  templatePrefix,
  planFields,
}) {
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
        category = ?
        OR template_key LIKE ?
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
  for (const row of days) {
    const planDay = row.planDay || planDayForDate(row.date);
    if (!planDay) continue;
    if (existsStmt.get(row.userId, row.date, category, `${templatePrefix}%`)) continue;

    const meal = planFields(planDay);
    const sortOrder = Number(maxSortStmt.get(row.userId, row.date).m) + 1;
    const payload = {
      userId: row.userId,
      date: row.date,
      planDay,
      planName: row.planName || '',
      time: mealTime(kind, planDay),
      category: meal.category,
      title: meal.title,
      description: meal.description,
      durationLabel: meal.durationLabel || '',
      durationMinutes: meal.durationMinutes,
      sortOrder,
    };
    if (hasTemplateKey) payload.templateKey = meal.templateKey;
    insert.run(payload);
    inserted += 1;
  }
  return { days: days.length, inserted };
}

function syncMealContent(database, category, templatePrefix, planFields) {
  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!cols.includes('template_key')) return 0;

  const update = database.prepare(`
    UPDATE tasks
    SET title = @title,
        description = @description,
        category = @category,
        template_key = @templateKey,
        duration_label = @durationLabel,
        duration_minutes = @durationMinutes,
        updated_at = datetime('now')
    WHERE plan_day = @planDay
      AND (
        category = @category
        OR template_key = @templateKey
        OR template_key LIKE @templatePrefix
      )
  `);

  let updated = 0;
  for (let day = 1; day <= 7; day += 1) {
    const content = planFields(day);
    const result = update.run({
      title: content.title,
      description: content.description,
      category,
      templateKey: content.templateKey,
      templatePrefix: `${templatePrefix}%`,
      durationLabel: content.durationLabel || '',
      durationMinutes: content.durationMinutes,
      planDay: day,
    });
    updated += result.changes || 0;
  }
  return updated;
}

/**
 * @param {{ force?: boolean, database?: import('better-sqlite3').Database }} [options]
 */
export function ensurePlanLunchDinner(options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) return { applied: false, reason: 'already_applied' };
  }

  let lunch = { days: 0, inserted: 0 };
  let dinner = { days: 0, inserted: 0 };
  let lunchSynced = 0;
  let dinnerSynced = 0;

  database.transaction(() => {
    lunch = ensureMealSlots({
      database,
      kind: 'lunch',
      category: '午餐',
      templatePrefix: 'lunch-d',
      planFields: planLunchTaskFields,
    });
    dinner = ensureMealSlots({
      database,
      kind: 'dinner',
      category: '晚餐',
      templatePrefix: 'dinner-d',
      planFields: planDinnerTaskFields,
    });
    lunchSynced = syncMealContent(database, '午餐', 'lunch-d', planLunchTaskFields);
    dinnerSynced = syncMealContent(database, '晚餐', 'dinner-d', planDinnerTaskFields);
    database.prepare('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)').run(MIGRATION_ID);
  })();

  return {
    applied: true,
    lunch,
    dinner,
    lunchSynced,
    dinnerSynced,
  };
}
