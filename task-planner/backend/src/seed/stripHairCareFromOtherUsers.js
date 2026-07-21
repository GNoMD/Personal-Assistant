/**
 * 从非 gnomd 账号移除防脱用药 / 头皮按摩等专属任务（幂等）。
 */
import { getDb } from '../db.js';
import { HAIR_CARE_PLAN_USERNAME } from './planData.js';

const MIGRATION_ID = 'strip_hair_care_from_non_gnomd_v3';

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
export function stripHairCarePlanFromOtherUsers(options = {}) {
  const database = options.database || getDb();
  ensureMigrationsTable(database);

  if (!options.force) {
    const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
    if (done) return { applied: false, reason: 'already_applied' };
  }

  const gnomd = database
    .prepare('SELECT id FROM users WHERE lower(username) = lower(?)')
    .get(HAIR_CARE_PLAN_USERNAME);

  const gnomdId = gnomd?.id ?? -1;

  const deleteHair = database.prepare(`
    DELETE FROM tasks
    WHERE user_id IS NOT NULL
      AND user_id != ?
      AND (
        category IN ('用药', '按摩')
        OR title = '晚间洗发'
        OR title = '晨间洗发'
        OR title = '晨间护肤'
        OR title = '晚间护肤'
        OR title LIKE '米诺%'
        OR title LIKE '%非那%'
        OR title LIKE '外用非那%'
        OR title LIKE 'SSM%'
        OR title LIKE '%头皮按摩%'
        OR (
          category = '清单'
          AND (
            description LIKE '%用药%'
            OR description LIKE '%米诺%'
            OR description LIKE '%非那%'
          )
        )
      )
  `);

  const fixWake = database.prepare(`
    UPDATE tasks
    SET description = '起床，饮水200mL',
        updated_at = datetime('now')
    WHERE user_id IS NOT NULL
      AND user_id != ?
      AND title = '起床饮水'
      AND (description LIKE '%米诺%' OR description LIKE '%非那%' OR description LIKE '%洗发%')
  `);

  const fixSleep = database.prepare(`
    UPDATE tasks
    SET description = '放松就寝，保证充足睡眠',
        updated_at = datetime('now')
    WHERE user_id IS NOT NULL
      AND user_id != ?
      AND title = '入睡'
      AND (description LIKE '%米诺%' OR description LIKE '%非那%')
  `);

  let deleted = 0;
  let wakeFixed = 0;
  let sleepFixed = 0;

  database.transaction(() => {
    deleted = deleteHair.run(gnomdId).changes || 0;
    wakeFixed = fixWake.run(gnomdId).changes || 0;
    sleepFixed = fixSleep.run(gnomdId).changes || 0;
    database.prepare('INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime(\'now\'))')
      .run(MIGRATION_ID);
  })();

  return {
    applied: true,
    gnomdId: gnomdId === -1 ? null : gnomdId,
    deleted,
    wakeFixed,
    sleepFixed,
  };
}
