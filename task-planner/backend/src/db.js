import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { inferDuration } from './seed/durationMap.js';
import {
  buildBreakfastTaskContent,
  getPlanBreakfastRecipe,
} from './seed/breakfastRecipes.js';
import { weekdayMon1 } from './seed/planData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getDbPath() {
  return process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db');
}

let db;

function migrateLegacyTasksTable(database) {
  const row = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get();
  const sql = row?.sql || '';
  // Old v1 schema: UNIQUE(date, plan_day, sort_order) blocks per-user seeding
  if (!/UNIQUE\s*\(\s*date\s*,\s*plan_day\s*,\s*sort_order\s*\)/i.test(sql)) return;

  const rebuild = database.transaction(() => {
    database.exec(`
      CREATE TABLE tasks_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        team_id INTEGER,
        date TEXT NOT NULL,
        plan_day INTEGER NOT NULL,
        plan_name TEXT NOT NULL,
        time TEXT DEFAULT '',
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        duration_label TEXT DEFAULT '',
        duration_minutes INTEGER DEFAULT NULL,
        completed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, date, plan_day, sort_order)
      );

      INSERT INTO tasks_migrated (
        id, user_id, team_id, date, plan_day, plan_name, time, category, title,
        description, duration_label, duration_minutes, completed, sort_order, created_at, updated_at
      )
      SELECT
        id, user_id, team_id, date, plan_day, plan_name, time, category, title,
        description, duration_label, duration_minutes, completed, sort_order, created_at, updated_at
      FROM tasks
      WHERE user_id IS NOT NULL;

      DROP TABLE tasks;
      ALTER TABLE tasks_migrated RENAME TO tasks;
    `);
    database.exec('DROP INDEX IF EXISTS idx_tasks_completed');
  });
  rebuild();
}

function migrateSchema(database) {
  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!cols.includes('duration_label')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN duration_label TEXT DEFAULT ''`);
  }
  if (!cols.includes('duration_minutes')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN duration_minutes INTEGER DEFAULT NULL`);
  }
  if (!cols.includes('user_id')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN user_id INTEGER DEFAULT NULL`);
  }
  if (!cols.includes('team_id')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN team_id INTEGER DEFAULT NULL`);
  }
  if (!cols.includes('template_key')) {
    database.exec(`ALTER TABLE tasks ADD COLUMN template_key TEXT DEFAULT NULL`);
  }

  const recipeCols = database.prepare('PRAGMA table_info(recipes)').all().map((c) => c.name);
  if (recipeCols.length && !recipeCols.includes('source')) {
    database.exec(`ALTER TABLE recipes ADD COLUMN source TEXT NOT NULL DEFAULT 'custom'`);
  }
  if (recipeCols.length && !recipeCols.includes('template_key')) {
    database.exec(`ALTER TABLE recipes ADD COLUMN template_key TEXT DEFAULT NULL`);
  }
  if (recipeCols.length && !recipeCols.includes('series')) {
    database.exec(`ALTER TABLE recipes ADD COLUMN series TEXT NOT NULL DEFAULT ''`);
  }

  const userCols = database.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (userCols.length && !userCols.includes('role')) {
    database.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  }
  if (userCols.length && !userCols.includes('assistant_personality')) {
    database.exec(`ALTER TABLE users ADD COLUMN assistant_personality TEXT DEFAULT NULL`);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS recipe_favorites (
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );
    CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);

    CREATE TABLE IF NOT EXISTS fitness_favorites (
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_fitness_favorites_user ON fitness_favorites(user_id);

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY,
      profile_json TEXT NOT NULL DEFAULT '{}',
      completeness_score INTEGER NOT NULL DEFAULT 0,
      personalization_consent INTEGER NOT NULL DEFAULT 0,
      personalization_consent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_profiles_updated ON user_profiles(updated_at);

    CREATE TABLE IF NOT EXISTS user_profile_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      actor_user_id INTEGER NOT NULL,
      actor_role TEXT,
      changed_fields TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (actor_user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_profile_audit_user
      ON user_profile_audit_log(user_id, created_at DESC);
  `);
}

export const LIBRARY_USERNAME = '__recipe_library__';

/** Shared recipe library owner (not a login account). */
export function ensureRecipeLibraryUser(database) {
  const existing = database.prepare('SELECT id FROM users WHERE username = ?').get(LIBRARY_USERNAME);
  if (existing) return existing.id;
  const result = database.prepare(`
    INSERT INTO users (username, password_hash, display_name, role)
    VALUES (?, ?, ?, ?)
  `).run(LIBRARY_USERNAME, '!library-not-for-login!', '食谱库', 'user');
  return Number(result.lastInsertRowid);
}

/** Ensure configured usernames are system admins (default: gnomd). */
export function ensureSystemAdmins(database) {
  const fromEnv = (process.env.ADMIN_USERNAMES || 'gnomd')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!fromEnv.length) return;
  const update = database.prepare(`UPDATE users SET role = 'admin' WHERE username = ?`);
  for (const username of fromEnv) {
    update.run(username);
  }
}

export function backfillDurations(database) {
  const rows = database.prepare(
    `SELECT id, title, category, plan_day FROM tasks
     WHERE (duration_label IS NULL OR duration_label = '') AND user_id IS NOT NULL`
  ).all();
  if (!rows.length) return 0;
  const update = database.prepare(
    `UPDATE tasks SET duration_label = @durationLabel, duration_minutes = @durationMinutes WHERE id = @id`
  );
  const run = database.transaction(() => {
    for (const row of rows) {
      const d = inferDuration(row.title, row.category, row.plan_day);
      if (d.durationLabel) {
        update.run({ id: row.id, durationLabel: d.durationLabel, durationMinutes: d.durationMinutes });
      }
    }
  });
  run();
  return rows.length;
}

/**
 * 将计划中的早餐任务绑定到豆浆一周菜单（按日历星期 → soy-breakfast-dN）。
 * 覆盖系统计划早餐：营养早餐 / low-purine-* / soy-breakfast-*。
 */
export function syncPlanBreakfastTasksFromRecipes(database = getDb()) {
  const cols = database.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
  if (!cols.includes('template_key')) return 0;

  const rows = database.prepare(`
    SELECT id, date, title, template_key AS templateKey
    FROM tasks
    WHERE category = '早餐'
  `).all();

  const update = database.prepare(`
    UPDATE tasks
    SET title = @title,
        description = @description,
        template_key = @templateKey,
        duration_label = @durationLabel,
        duration_minutes = @durationMinutes,
        updated_at = datetime('now')
    WHERE id = @id
  `);

  let updated = 0;
  database.transaction(() => {
    for (const row of rows) {
      const key = row.templateKey || '';
      const isSystem = row.title === '营养早餐'
        || !key
        || key.startsWith('low-purine-')
        || key.startsWith('soy-breakfast-');
      if (!isSystem) continue;

      const weekDay = weekdayMon1(row.date);
      if (!weekDay) continue;
      const recipe = getPlanBreakfastRecipe(weekDay);
      if (!recipe) continue;
      const content = buildBreakfastTaskContent(recipe);
      if (content.templateKey === key && content.title === row.title) continue;

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

export function getDb() {
  if (!db) {
    const DB_PATH = getDbPath();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
    migrateSchema(db);
    ensureRecipeLibraryUser(db);
    ensureSystemAdmins(db);
    backfillDurations(db);
    syncPlanBreakfastTasksFromRecipes(db);
  }
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      assistant_personality TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      owner_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS team_members (
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      team_id INTEGER,
      date TEXT NOT NULL,
      plan_day INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      time TEXT DEFAULT '',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      duration_label TEXT DEFAULT '',
      duration_minutes INTEGER DEFAULT NULL,
      template_key TEXT DEFAULT NULL,
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      changes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT '早餐',
      ingredients TEXT NOT NULL DEFAULT '',
      steps TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      prep_minutes INTEGER,
      calories INTEGER,
      tags TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'custom',
      template_key TEXT,
      series TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recipe_favorites (
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT '午餐',
      notes TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      menu_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (menu_id, recipe_id),
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS fitness_favorites (
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, item_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assistant_openclaw_windows (
      user_id INTEGER PRIMARY KEY,
      window_gen INTEGER NOT NULL DEFAULT 1,
      previous_response_id TEXT,
      approx_chars INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      rotated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assistant_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '新对话',
      previous_response_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assistant_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      action_json TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES assistant_sessions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assistant_actions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      session_id TEXT,
      tool_name TEXT NOT NULL,
      arguments TEXT NOT NULL,
      call_id TEXT NOT NULL,
      response_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY,
      profile_json TEXT NOT NULL DEFAULT '{}',
      completeness_score INTEGER NOT NULL DEFAULT 0,
      personalization_consent INTEGER NOT NULL DEFAULT 0,
      personalization_consent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_profile_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      actor_user_id INTEGER NOT NULL,
      actor_role TEXT,
      changed_fields TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (actor_user_id) REFERENCES users(id)
    );
  `);

  migrateSchema(database);
  migrateLegacyTasksTable(database);

  const actionCols = database.prepare('PRAGMA table_info(assistant_actions)').all().map((c) => c.name);
  if (actionCols.length && !actionCols.includes('session_id')) {
    database.exec('ALTER TABLE assistant_actions ADD COLUMN session_id TEXT');
  }

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_audit_task ON task_audit_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON task_audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_menus_user ON menus(user_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_recipe ON menu_items(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_fitness_favorites_user ON fitness_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_assistant_actions_user_status
      ON assistant_actions(user_id, status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user_updated
      ON assistant_sessions(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_assistant_messages_session
      ON assistant_messages(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_updated ON user_profiles(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_profile_audit_user
      ON user_profile_audit_log(user_id, created_at DESC);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export { getDbPath as DB_PATH };
