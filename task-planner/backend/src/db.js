import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { inferDuration } from './seed/durationMap.js';
import { BREAKFAST_DESCRIPTIONS } from './seed/breakfastRecipes.js';

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

  const recipeCols = database.prepare('PRAGMA table_info(recipes)').all().map((c) => c.name);
  if (recipeCols.length && !recipeCols.includes('source')) {
    database.exec(`ALTER TABLE recipes ADD COLUMN source TEXT NOT NULL DEFAULT 'custom'`);
  }
  if (recipeCols.length && !recipeCols.includes('template_key')) {
    database.exec(`ALTER TABLE recipes ADD COLUMN template_key TEXT DEFAULT NULL`);
  }

  const userCols = database.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (userCols.length && !userCols.includes('role')) {
    database.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
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

function migrateBreakfastTasks(database) {
  const legacyBreakfasts = [
    '原味黑豆浆 + 全麦吐司 + 核桃仁15g + 苹果',
    '黄豆豆浆燕麦 + 纯燕麦40g + 巴旦木12g + 香蕉',
    '黑豆豆浆 + 蒸紫薯150g + 腰果南瓜子 + 蓝莓',
    '双豆豆浆 + 小米南瓜粥 + 松子10g + 橙子',
    '豆浆 + 玉米 + 糙米饭团 + 混合坚果 + 猕猴桃',
    '豆浆+鸡蛋 + 荞麦面80g + 夏威夷果10g + 梨（周末08:00）',
    '五红豆浆 + 杂粮饭团 + 榛子奇亚籽 + 柚子草莓（周末08:00）',
  ];
  // Current + previous system titles so renames still refresh.
  const recipeTitlePatterns = [
    ['莲子百合燕麦饮活力早餐'],
    ['白扁豆山药鸡蛋早餐'],
    ['无乳糖酸奶燕麦莓果碗', '希腊酸奶燕麦莓果碗'],
    ['四神燕麦饮鸡肉全麦早餐'],
    ['小份黄豆浆紫薯训练早餐'],
    ['绿豆百合无乳糖奶恢复早餐', '绿豆百合低脂奶恢复早餐'],
    ['无豆山药莲子荞麦早餐'],
  ];
  const updateLegacy = database.prepare(`
    UPDATE tasks
    SET description = ?, updated_at = datetime('now')
    WHERE category = '早餐' AND title = '营养早餐'
      AND plan_day = ? AND description = ?
  `);
  // Refresh system blurbs only; leave user-edited descriptions alone.
  const refreshSystem = database.prepare(`
    UPDATE tasks
    SET description = ?, updated_at = datetime('now')
    WHERE category = '早餐' AND title = '营养早餐' AND plan_day = ?
      AND description LIKE ?
  `);
  database.transaction(() => {
    for (let day = 1; day <= 7; day += 1) {
      updateLegacy.run(BREAKFAST_DESCRIPTIONS[day], day, legacyBreakfasts[day - 1]);
      for (const title of recipeTitlePatterns[day - 1]) {
        refreshSystem.run(BREAKFAST_DESCRIPTIONS[day], day, `${title}%`);
      }
    }
  })();
}

/** Remove minoxidil / finasteride / scalp-massage system tasks from existing users. */
function migrateRemoveMedicationTasks(database) {
  database.prepare(`
    DELETE FROM tasks
    WHERE category IN ('用药', '按摩')
       OR title IN (
         '确认头皮干燥',
         '米诺地尔（晨）',
         '米诺地尔按摩（晨）',
         '米诺地尔（午）',
         '米诺地尔按摩（午）',
         '非那雄胺喷雾',
         '非那雄胺促渗按摩',
         'SSM标准化头皮按摩'
       )
       OR title LIKE '米诺%'
       OR title LIKE '非那%'
       OR title LIKE 'SSM%'
  `).run();

  database.prepare(`
    UPDATE tasks
    SET description = '放松就寝，保证充足睡眠',
        updated_at = datetime('now')
    WHERE title = '入睡'
      AND (
        description LIKE '%非那%'
        OR description LIKE '%米诺%'
      )
  `).run();

  database.prepare(`
    UPDATE tasks
    SET description = '起床，饮水200mL',
        updated_at = datetime('now')
    WHERE title = '起床饮水'
      AND description LIKE '%不洗发%'
  `).run();

  // Refresh day checklist blurbs that still mention medication.
  const checklistUpdates = [
    [1, 1, '记录今日精力与睡眠感受'],
    [2, 1, '完成有氧训练后适度补水'],
    [3, 1, '力量训练注意动作标准，避免受伤'],
    [4, 1, '训练后做好拉伸放松'],
    [5, 1, '检查本周运动完成情况'],
    [7, 1, '本周运动与早餐复盘'],
  ];
  const updateChecklist = database.prepare(`
    UPDATE tasks
    SET description = ?, updated_at = datetime('now')
    WHERE category = '清单' AND plan_day = ? AND title = ?
  `);
  database.transaction(() => {
    for (const [planDay, index, description] of checklistUpdates) {
      updateChecklist.run(description, planDay, `完成项 ${index}`);
    }
    // Day 7 used to have two checklist items; drop the scalp-photo one if still present.
    database.prepare(`
      DELETE FROM tasks
      WHERE category = '清单' AND plan_day = 7 AND title = '完成项 2'
        AND (
          description LIKE '%头顶%'
          OR description LIKE '%发际线%'
          OR description LIKE '%用药%'
        )
    `).run();
  })();
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
    migrateBreakfastTasks(db);
    migrateRemoveMedicationTasks(db);
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
  `);

  migrateSchema(database);
  migrateLegacyTasksTable(database);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_audit_task ON task_audit_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON task_audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export { getDbPath as DB_PATH };
