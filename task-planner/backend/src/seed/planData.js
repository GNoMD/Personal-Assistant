/** 7 日计划模板 — 源自《7天综合健康与脱发管理计划》（已去掉米诺/非那/头皮按摩用药流程） */

import { inferDuration } from './durationMap.js';
import { BREAKFAST_DESCRIPTIONS } from './breakfastRecipes.js';
import { GYM_WEEK_BY_PLAN_DAY } from './beginnerGymWeek.js';

export const PLAN_META = [
  { day: 1, name: '体态启动日', theme: '晚间拉背，改善圆肩驼背' },
  { day: 2, name: '胸推入门日', theme: '卧推架 + 龙门架推拉平衡' },
  { day: 3, name: '腿部入门日', theme: '史密斯深蹲 + 髋外展内收' },
  { day: 4, name: '背厚背宽日', theme: '高位下拉 / 划船强化体态' },
  { day: 5, name: '胸腿综合日', theme: '卧推 + 哈克深蹲增肌' },
  { day: 6, name: '主动恢复日', theme: '轻量髋稳定 + 拉伸' },
  { day: 7, name: '全身巩固日', theme: '深蹲架/史密斯 + 推拉串练' },
];

const CHECKLIST = {
  1: [GYM_WEEK_BY_PLAN_DAY[1].checklist],
  2: [GYM_WEEK_BY_PLAN_DAY[2].checklist],
  3: [GYM_WEEK_BY_PLAN_DAY[3].checklist],
  4: [GYM_WEEK_BY_PLAN_DAY[4].checklist],
  5: [GYM_WEEK_BY_PLAN_DAY[5].checklist],
  6: [GYM_WEEK_BY_PLAN_DAY[6].checklist, '保证睡眠≥7.5小时'],
  7: [GYM_WEEK_BY_PLAN_DAY[7].checklist, '本周运动与早餐复盘'],
};

function withDuration(task, planDay) {
  const d = inferDuration(task.title, task.category, planDay);
  return { ...task, durationLabel: d.durationLabel, durationMinutes: d.durationMinutes };
}

function baseTasks(planDay, isWeekend) {
  const wake = isWeekend ? '07:30' : '06:30';
  const breakfast = isWeekend ? '08:00' : '07:00';
  const wash = isWeekend ? '21:00' : '20:00';
  const gym = GYM_WEEK_BY_PLAN_DAY[planDay];

  const raw = [
    { time: wake, category: '作息', title: '起床饮水', description: '起床，饮水200mL' },
    { time: breakfast, category: '早餐', title: '营养早餐', description: BREAKFAST_DESCRIPTIONS[planDay] },
    { time: wash, category: '护理', title: '晚间洗发', description: '温和洗发露清洗头皮，完全吹干' },
    { time: '23:00', category: '作息', title: '入睡', description: '放松就寝，保证充足睡眠' },
    {
      time: gym.time,
      category: '运动',
      title: gym.title,
      description: gym.description,
      durationLabel: `约 ${gym.minutes} 分钟`,
      durationMinutes: gym.minutes,
    },
    ...(CHECKLIST[planDay] || []).map((item, i) => ({
      time: '',
      category: '清单',
      title: `完成项 ${i + 1}`,
      description: item,
    })),
  ];

  return raw.map((t) => {
    if (t.durationLabel) return t;
    return withDuration(t, planDay);
  });
}

export function getTasksForPlanDay(planDay) {
  const isWeekend = planDay === 6 || planDay === 7;
  const meta = PLAN_META[planDay - 1];
  return baseTasks(planDay, isWeekend).map((t, index) => ({
    ...t,
    planDay,
    planName: meta.name,
    sortOrder: index,
  }));
}

export const START_DATE = '2026-07-01';
export const SEED_DAYS = 365;

export function planDayForDate(dateStr) {
  const [sy, sm, sd] = START_DATE.split('-').map(Number);
  const [cy, cm, cd] = dateStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const current = new Date(cy, cm - 1, cd);
  const diff = Math.round((current - start) / 86400000);
  if (diff < 0) return null;
  return (diff % 7) + 1;
}
