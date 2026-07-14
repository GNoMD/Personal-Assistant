import { getDb } from '../db.js';
import { START_DATE, SEED_DAYS, planDayForDate, getTasksForPlanDay } from './planData.js';
import { getRecipeSeedStats, seedSharedRecipeLibrary } from './seedRecipes.js';
import {
  DEFAULT_ADMIN_USERNAME,
  ensureDefaultAdminUser,
} from './ensureDefaultAdmin.js';
import path from 'path';
import { fileURLToPath } from 'url';

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const y2 = dt.getFullYear();
  const m2 = String(dt.getMonth() + 1).padStart(2, '0');
  const d2 = String(dt.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
}

export function seedUserTasks(userId) {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id = ?').get(userId).c;
  if (existing > 0) return { seeded: false, count: existing };

  const insert = db.prepare(`
    INSERT INTO tasks (user_id, date, plan_day, plan_name, time, category, title, description,
      duration_label, duration_minutes, completed, sort_order)
    VALUES (@userId, @date, @planDay, @planName, @time, @category, @title, @description,
      @durationLabel, @durationMinutes, 0, @sortOrder)
  `);

  let total = 0;
  const seedMany = db.transaction(() => {
    for (let i = 0; i < SEED_DAYS; i++) {
      const date = addDays(START_DATE, i);
      const planDay = planDayForDate(date);
      const templates = getTasksForPlanDay(planDay);
      for (const t of templates) {
        insert.run({
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
          sortOrder: t.sortOrder,
        });
        total++;
      }
    }
  });
  seedMany();
  return { seeded: true, total };
}

/** @deprecated 全局种子仅用于迁移；新用户通过 seedUserTasks */
export function seedDatabase(force = false) {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id IS NULL').get().c;
  if (count > 0 && !force) {
    return { seeded: false, message: 'Legacy global tasks exist', count };
  }
  if (force) {
    db.prepare('DELETE FROM tasks WHERE user_id IS NULL').run();
  }
  return { seeded: false, message: 'Use per-user seed on registration' };
}

const isCli = process.argv[1]
  && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isCli) {
  getDb();
  const libraryUserId = seedSharedRecipeLibrary();
  const admin = ensureDefaultAdminUser();
  const taskSeed = seedUserTasks(admin.userId);
  const stats = getRecipeSeedStats();
  const recipeCount = getDb().prepare('SELECT COUNT(*) AS c FROM recipes').get().c;
  const taskCount = getDb().prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(admin.userId).c;
  console.log(JSON.stringify({
    ok: true,
    libraryUserId,
    recipeTemplates: stats,
    recipesInDb: recipeCount,
    admin: {
      username: DEFAULT_ADMIN_USERNAME,
      userId: admin.userId,
      created: admin.created,
      tasksSeeded: taskSeed,
      tasks: taskCount,
    },
    note: '勿提交本地 tasks.db；管理员引导密码不会打印到日志',
  }, null, 2));
}
