/**
 * 将小白 7 天晚间器械计划同步到 2026-07-13 ~ 2026-07-19 的「运动」任务。
 * 用法：node scripts/syncGymWeekToDb.cjs
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db');

const GYM_WEEK_BY_DATE = {
  '2026-07-13': {
    title: '晚间训练 · 体态启动（拉背）',
    time: '19:00',
    minutes: 45,
    planName: '体态启动日',
    checklist: '面拉时肘向后、肩胛后夹，避免耸肩',
    description: [
      '目标：启动运动习惯，激活背部对抗圆肩驼背。约 45 分钟。',
      '热身 5 分钟：快走或关节环绕。',
      '① 龙门架 · 面拉 3 组 × 12～15 次（滑轮高位，拉至面门两侧，肩外旋）',
      '② 高位下拉 / 坐姿划船 · 坐姿划船 3 组 × 10～12 次（拉至腹前，肩胛后夹）',
      '③ 高位下拉 3 组 × 10～12 次（轻重量，沉肩下拉至锁骨上方）',
      '拉伸 5 分钟：开门式胸部拉伸、颈肩放松、猫牛式。',
      '重量：以动作标准、力竭前还能 1～2 次为准。',
    ].join('\n'),
  },
  '2026-07-14': {
    title: '晚间训练 · 胸推入门',
    time: '19:00',
    minutes: 45,
    planName: '胸推入门日',
    checklist: '卧推设好安全杠或请人保护，先空杆找感觉',
    description: [
      '目标：胸、肩前束、肱三头入门推举。约 45 分钟。',
      '热身 5 分钟 + 空杆卧推 2 组热身。',
      '① 卧推架 · 平板卧推 3 组 × 8～10 次（轻重量，沉肩收肩胛，杆触胸中下）',
      '② 龙门架 · 绳索夹胸 3 组 × 12 次（肘微屈，向中线合拢）',
      '③ 龙门架 · 面拉 2 组 × 15 次（推日也补拉，平衡体态）',
      '拉伸 5 分钟：胸大肌、肩前侧。',
    ].join('\n'),
  },
  '2026-07-15': {
    title: '晚间训练 · 腿部入门',
    time: '19:00',
    minutes: 45,
    planName: '腿部入门日',
    checklist: '史密斯深蹲膝盖朝脚尖，核心收紧不塌腰',
    description: [
      '目标：下肢力量与髋稳定。约 45 分钟。',
      '热身 5 分钟：深蹲空蹲 + 髋关节环绕。',
      '① 史密斯机 · 深蹲 3 组 × 10 次（安全销调好，下至可控制深度）',
      '② 髋外展 3 组 × 12～15 次（练侧臀，改善骨盆稳定）',
      '③ 腿内收 2 组 × 12～15 次',
      '拉伸 5 分钟：股四头、腘绳、髋屈肌。',
    ].join('\n'),
  },
  '2026-07-16': {
    title: '晚间训练 · 背厚背宽',
    time: '19:00',
    minutes: 50,
    planName: '背厚背宽日',
    checklist: '拉类动作优先肩胛发力，减少手臂代偿',
    description: [
      '目标：加强背阔与中下斜方，改善驼背圆肩。约 50 分钟。',
      '热身 5 分钟。',
      '① 高位下拉 4 组 × 10～12 次',
      '② 坐姿划船 4 组 × 10～12 次',
      '③ 龙门架 · 面拉 3 组 × 12～15 次',
      '拉伸 5 分钟：背阔、胸椎伸展（仰卧毛巾卷垫在上背）。',
    ].join('\n'),
  },
  '2026-07-17': {
    title: '晚间训练 · 胸腿综合',
    time: '19:00',
    minutes: 50,
    planName: '胸腿综合日',
    checklist: '哈克深蹲背部贴靠垫，不要臀部离开靠背',
    description: [
      '目标：推+腿组合，促进全身增肌。约 50 分钟。',
      '热身 5 分钟。',
      '① 卧推架 · 轻量卧推 3 组 × 8～10 次',
      '② 哈克深蹲 3 组 × 10～12 次（腰背压力小，新手友好）',
      '③ 龙门架 · 绳索夹胸 2 组 × 12 次',
      '拉伸 5 分钟：胸、腿前侧。',
    ].join('\n'),
  },
  '2026-07-18': {
    title: '晚间训练 · 主动恢复',
    time: '19:00',
    minutes: 40,
    planName: '主动恢复日',
    checklist: '今天重量偏轻，把拉伸和呼吸做完整',
    description: [
      '目标：主动恢复，巩固髋稳定与体态。约 40 分钟。',
      '热身 5 分钟：轻松走动。',
      '① 史密斯机 · 浅蹲或臀桥式轻蹲 2 组 × 12 次（很轻）',
      '② 髋外展 3 组 × 15 次',
      '③ 龙门架 · 轻面拉 2 组 × 15 次',
      '全身拉伸 / 胸椎伸展 10 分钟：猫牛、婴儿式、开门拉伸。',
    ].join('\n'),
  },
  '2026-07-19': {
    title: '晚间训练 · 全身巩固',
    time: '19:00',
    minutes: 55,
    planName: '全身巩固日',
    checklist: '深蹲架必须调好安全杠；不熟可改史密斯深蹲',
    description: [
      '目标：一周动作串练，巩固增肌与体态。约 55 分钟。',
      '热身 5～8 分钟。',
      '① 深蹲架（安全杠保护）或史密斯 · 深蹲 3 组 × 8～10 次',
      '② 高位下拉 3 组 × 10 次',
      '③ 卧推架 · 轻量卧推 2 组 × 8 次',
      '④ 龙门架 · 面拉 2 组 × 15 次',
      '拉伸 5～8 分钟，并回顾本周睡眠与训练感受。',
    ].join('\n'),
  },
};

if (!fs.existsSync(DB_PATH)) {
  console.error('DB not found:', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);

const updateExercise = db.prepare(`
  UPDATE tasks
  SET title = @title,
      description = @description,
      time = @time,
      duration_label = @durationLabel,
      duration_minutes = @minutes,
      plan_name = @planName,
      updated_at = datetime('now')
  WHERE user_id = @userId AND date = @date AND category = '运动'
`);

const updateChecklist1 = db.prepare(`
  UPDATE tasks
  SET description = @checklist,
      updated_at = datetime('now')
  WHERE user_id = @userId AND date = @date AND category = '清单' AND title = '完成项 1'
`);

const users = db.prepare('SELECT id FROM users').all();
const dates = Object.keys(GYM_WEEK_BY_DATE).sort();

const run = db.transaction(() => {
  let exerciseUpdated = 0;
  let checklistUpdated = 0;
  for (const user of users) {
    for (const date of dates) {
      const gym = GYM_WEEK_BY_DATE[date];
      const r1 = updateExercise.run({
        userId: user.id,
        date,
        title: gym.title,
        description: gym.description,
        time: gym.time,
        durationLabel: `约 ${gym.minutes} 分钟`,
        minutes: gym.minutes,
        planName: gym.planName,
      });
      exerciseUpdated += r1.changes;
      const r2 = updateChecklist1.run({
        userId: user.id,
        date,
        checklist: gym.checklist,
      });
      checklistUpdated += r2.changes;
    }
  }
  return { exerciseUpdated, checklistUpdated, users: users.length, days: dates.length };
});

const result = run();
console.log('Synced gym week:', result);
console.log(
  'Sample gnomd:',
  db
    .prepare(
      `SELECT date, time, title, duration_minutes
       FROM tasks WHERE user_id = 2 AND category = '运动'
         AND date BETWEEN '2026-07-13' AND '2026-07-19'
       ORDER BY date`
    )
    .all()
);
