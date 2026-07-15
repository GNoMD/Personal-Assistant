import { getDb } from '../db.js';
import { DEFAULT_ADMIN_USERNAME } from './ensureDefaultAdmin.js';
import { saveUserProfile } from '../services/userProfile.js';

const MIGRATION_ID = 'gnomd_initial_profile_v1';

/**
 * Seed gnomd AGA / medication assumptions into personal profile once.
 * Does NOT rewrite tasks or medication schedule.
 */
export function ensureGnomdProfile(database = getDb()) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const done = database.prepare('SELECT 1 AS ok FROM schema_migrations WHERE id = ?').get(MIGRATION_ID);
  if (done) return { skipped: true };

  const user = database.prepare(
    'SELECT id, username, role FROM users WHERE lower(username) = lower(?)'
  ).get(DEFAULT_ADMIN_USERNAME);
  if (!user) {
    database.prepare('INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)').run(MIGRATION_ID);
    return { skipped: true, reason: 'no_gnomd' };
  }

  const existing = database.prepare(
    'SELECT user_id FROM user_profiles WHERE user_id = ?'
  ).get(user.id);
  if (existing) {
    database.prepare(
      "INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime('now'))"
    ).run(MIGRATION_ID);
    return { skipped: true, reason: 'already_has_profile' };
  }

  saveUserProfile(user.id, {
    health: {
      conditions: ['aga', 'hair_loss_care'],
      medications: [
        {
          name: '米诺地尔',
          route: '外用',
          frequency: '按计划',
          time: '晚间',
          note: '由既有防脱计划迁移为画像初始值，不自动改写任务',
        },
      ],
      hairCare: {
        needed: true,
        shampooHabit: '',
        minoxidilAvoidSweatMinutes: 120,
        notes: '防脱/头皮护理需求（历史 hardcode username=gnomd 的迁移）。首期不自动重建任务。',
      },
    },
    goals: {
      primaryGoals: ['hair_care', 'health_maintenance'],
      motivation: '维持现有健康与护理计划',
    },
    privacy: {
      personalizationConsent: false,
    },
  }, { id: user.id, role: user.role || 'admin' });

  database.prepare(
    "INSERT OR REPLACE INTO schema_migrations (id, applied_at) VALUES (?, datetime('now'))"
  ).run(MIGRATION_ID);

  return { seeded: true, userId: user.id };
}
