/**
 * 为指定用户补全某一天缺失的健康计划任务（不删已有、不改完成状态）。
 * Usage: node scripts/fillDayTasks.js --user=gnomd --date=2026-07-16
 */
import { getDb } from '../src/db.js';
import { getTasksForPlanDay, isHairCarePlanUsername, planDayForDate } from '../src/seed/planData.js';

function arg(name, fallback = null) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const date = arg('date', '2026-07-16');
const username = arg('user', 'gnomd');

const db = getDb();
const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
if (!user) {
  console.error(`用户不存在: ${username}`);
  process.exit(1);
}

const planDay = planDayForDate(date);
if (!planDay) {
  console.error(`日期不在计划范围内: ${date}`);
  process.exit(1);
}

const includeHairCare = isHairCarePlanUsername(user.username);
const templates = getTasksForPlanDay(planDay, { includeHairCare });
const existing = db
  .prepare(
    `SELECT id, category, title, template_key AS templateKey
     FROM tasks WHERE user_id = ? AND date = ?`
  )
  .all(user.id, date);

function alreadyHas(t) {
  return existing.some((row) => {
    if (t.templateKey && row.templateKey === t.templateKey) return true;
    return row.category === t.category && row.title === t.title;
  });
}

const maxSort = db
  .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM tasks WHERE user_id = ? AND date = ?')
  .get(user.id, date).m;

const insert = db.prepare(`
  INSERT INTO tasks (
    user_id, date, plan_day, plan_name, time, category, title, description,
    duration_label, duration_minutes, template_key, completed, sort_order
  ) VALUES (
    @userId, @date, @planDay, @planName, @time, @category, @title, @description,
    @durationLabel, @durationMinutes, @templateKey, 0, @sortOrder
  )
`);

const missing = templates.filter((t) => !alreadyHas(t));
let sortOrder = Number(maxSort) + 1;
const inserted = [];

db.transaction(() => {
  for (const t of missing) {
    insert.run({
      userId: user.id,
      date,
      planDay: t.planDay,
      planName: t.planName,
      time: t.time || '',
      category: t.category,
      title: t.title,
      description: t.description || '',
      durationLabel: t.durationLabel || '',
      durationMinutes: t.durationMinutes ?? null,
      templateKey: t.templateKey || null,
      sortOrder: t.sortOrder ?? sortOrder++,
    });
    inserted.push(`${t.time || '--'} [${t.category}] ${t.title}`);
  }
})();

console.log(`user=${user.username} date=${date} planDay=${planDay} hairCare=${includeHairCare}`);
console.log(`existing=${existing.length} missing=${missing.length} inserted=${inserted.length}`);
inserted.forEach((line) => console.log(' +', line));

const after = db
  .prepare(
    `SELECT time, category, title FROM tasks WHERE user_id = ? AND date = ?
     ORDER BY CASE WHEN time = '' OR time IS NULL THEN 1 ELSE 0 END, time, sort_order`
  )
  .all(user.id, date);
console.log('\n最终任务:');
after.forEach((t) => console.log(` ${t.time || '--'} [${t.category}] ${t.title}`));
