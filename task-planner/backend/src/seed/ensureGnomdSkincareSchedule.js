/**
 * 为 gnomd 既有日历写入「晨间护肤 / 晚间护肤」（幂等）。
 */
import { getDb } from '../db.js';
import {
  getSkincareTasks,
  getTasksForPlanDay,
  planDayForDate,
  SKINCARE_TITLES,
} from './planData.js';
import { inferDuration } from './durationMap.js';

const MIGRATION_ID = 'gnomd_skincare_am_pm_v1';

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
export function ensureGnomdSkincareSchedule(userId, options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) {
      const refreshed = syncSkincareContent(userId, database);
      return { applied: false, reason: 'already_applied', refreshed };
    }
  }

  const dates = database
    .prepare('SELECT DISTINCT date, plan_day, plan_name FROM tasks WHERE user_id = ? ORDER BY date')
    .all(userId);

  if (!dates.length) {
    database.prepare('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)').run(MIGRATION_ID);
    return { applied: true, dates: 0, inserted: 0, note: 'no_existing_tasks' };
  }

  const existsStmt = database.prepare(`
    SELECT id FROM tasks
    WHERE user_id = ? AND date = ? AND title = ?
    LIMIT 1
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

  let inserted = 0;
  database.transaction(() => {
    for (const row of dates) {
      const planDay = row.plan_day || planDayForDate(row.date);
      if (!planDay) continue;
      const isWeekend = planDay === 6 || planDay === 7;
      const planName = row.plan_name
        || getTasksForPlanDay(planDay, { includeHairCare: true })[0]?.planName
        || '';

      let sortOrder = maxSortStmt.get(userId, row.date).m + 1;
      for (const skin of getSkincareTasks(isWeekend)) {
        if (existsStmt.get(userId, row.date, skin.title)) continue;
        const d = inferDuration(skin.title, skin.category, planDay);
        insert.run({
          userId,
          date: row.date,
          planDay,
          planName,
          time: skin.time,
          category: skin.category,
          title: skin.title,
          description: skin.description,
          durationLabel: d.durationLabel || '约 5 分钟',
          durationMinutes: d.durationMinutes ?? 5,
          sortOrder,
        });
        sortOrder += 1;
        inserted += 1;
      }
    }

    database.prepare(
      "INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime('now'))"
    ).run(MIGRATION_ID);
  })();

  const refreshed = syncSkincareContent(userId, database);
  return {
    applied: true,
    dates: dates.length,
    inserted,
    titles: [...SKINCARE_TITLES],
    refreshed,
  };
}

/** 已存在的护肤任务刷新时间与文案 */
export function syncSkincareContent(userId, database = getDb()) {
  const rows = database.prepare(`
    SELECT id, date, plan_day AS planDay, title
    FROM tasks
    WHERE user_id = ?
      AND title IN ('晨间护肤', '晚间护肤')
  `).all(userId);

  const update = database.prepare(`
    UPDATE tasks
    SET time = @time,
        category = '护理',
        description = @description,
        duration_label = @durationLabel,
        duration_minutes = @durationMinutes,
        updated_at = datetime('now')
    WHERE id = @id
  `);

  let updated = 0;
  database.transaction(() => {
    for (const row of rows) {
      const planDay = row.planDay || planDayForDate(row.date);
      if (!planDay) continue;
      const isWeekend = planDay === 6 || planDay === 7;
      const skin = getSkincareTasks(isWeekend).find((t) => t.title === row.title);
      if (!skin) continue;
      const d = inferDuration(skin.title, skin.category, planDay);
      const result = update.run({
        id: row.id,
        time: skin.time,
        description: skin.description,
        durationLabel: d.durationLabel || '约 5 分钟',
        durationMinutes: d.durationMinutes ?? 5,
      });
      updated += result.changes || 0;
    }
  })();
  return updated;
}
