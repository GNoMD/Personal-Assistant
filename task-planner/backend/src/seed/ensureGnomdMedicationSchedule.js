/**
 * 为系统管理员 gnomd 的既有日历写入「早米诺 / 午非那 / 晚米诺」任务（幂等）。
 */
import { getDb } from '../db.js';
import {
  getMedicationTasks,
  getTasksForPlanDay,
  MEDICATION_TITLES,
  planDayForDate,
} from './planData.js';
import { inferDuration } from './durationMap.js';

const MIGRATION_ID = 'gnomd_med_schedule_v2_am_noon_pm';

const LEGACY_MED_TITLES = [
  '确认头皮干燥',
  '米诺地尔（晨）',
  '米诺地尔按摩（晨）',
  '米诺地尔（午）',
  '米诺地尔按摩（午）',
  '米诺地尔（晚）',
  '非那雄胺喷雾',
  '外用非那雄胺（午）',
  '非那雄胺促渗按摩',
  'SSM标准化头皮按摩',
];

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * @param {number} userId gnomd 的 user id
 * @param {{ force?: boolean, database?: import('better-sqlite3').Database }} [options]
 */
export function ensureGnomdMedicationSchedule(userId, options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) return { applied: false, reason: 'already_applied' };
  }

  const dates = database
    .prepare('SELECT DISTINCT date, plan_day, plan_name FROM tasks WHERE user_id = ? ORDER BY date')
    .all(userId);

  if (!dates.length) {
    database.prepare('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)').run(MIGRATION_ID);
    return { applied: true, dates: 0, inserted: 0, note: 'no_existing_tasks' };
  }

  const deleteLegacy = database.prepare(`
    DELETE FROM tasks
    WHERE user_id = ?
      AND date = ?
      AND (
        category IN ('用药', '按摩')
        OR title IN (${LEGACY_MED_TITLES.map(() => '?').join(', ')})
        OR title LIKE '米诺%'
        OR title LIKE '非那%'
        OR title LIKE '外用非那%'
        OR title LIKE 'SSM%'
      )
  `);

  const insert = database.prepare(`
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

  const updateWake = database.prepare(`
    UPDATE tasks
    SET description = '起床，饮水200mL；晨间一般不洗发，待头皮干燥后涂早米诺',
        updated_at = datetime('now')
    WHERE user_id = ? AND date = ? AND title = '起床饮水'
  `);

  const updateWash = database.prepare(`
    UPDATE tasks
    SET description = '温和洗发露清洗头皮，完全吹干后准备晚米诺；一天最多洗 1 次',
        updated_at = datetime('now')
    WHERE user_id = ? AND date = ? AND title = '晚间洗发'
  `);

  const updateSleep = database.prepare(`
    UPDATE tasks
    SET description = '放松就寝；晚米诺尽量停留后再睡，保证充足睡眠',
        updated_at = datetime('now')
    WHERE user_id = ? AND date = ? AND title = '入睡'
  `);

  let inserted = 0;
  const run = database.transaction(() => {
    for (const row of dates) {
      const planDay = row.plan_day || planDayForDate(row.date);
      if (!planDay) continue;
      const isWeekend = planDay === 6 || planDay === 7;
      const planName = row.plan_name || getTasksForPlanDay(planDay, { includeHairCare: true })[0]?.planName || '';

      deleteLegacy.run(userId, row.date, ...LEGACY_MED_TITLES);

      let sortOrder = maxSortStmt.get(userId, row.date).m + 1;
      for (const med of getMedicationTasks(isWeekend)) {
        const d = inferDuration(med.title, med.category, planDay);
        insert.run({
          userId,
          date: row.date,
          planDay,
          planName,
          time: med.time,
          category: med.category,
          title: med.title,
          description: med.description,
          durationLabel: d.durationLabel || '',
          durationMinutes: d.durationMinutes ?? null,
          sortOrder,
        });
        sortOrder += 1;
        inserted += 1;
      }

      updateWake.run(userId, row.date);
      updateWash.run(userId, row.date);
      updateSleep.run(userId, row.date);
    }

    database.prepare('INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime(\'now\'))')
      .run(MIGRATION_ID);
  });
  run();

  return {
    applied: true,
    dates: dates.length,
    inserted,
    titles: [...MEDICATION_TITLES],
  };
}
