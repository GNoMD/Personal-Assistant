/** 7 日计划模板
 * - 通用用户：作息、早/午/晚餐、下午茶、运动、基础清单
 * - 仅 gnomd：叠加米诺/非那用药、晨间洗发与防脱相关清单文案
 */

import { inferDuration } from './durationMap.js';
import { planBreakfastTaskFields } from './breakfastRecipes.js';
import { planAfternoonTeaTaskFields } from './afternoonTeaRecipes.js';
import { planEveningSnackTaskFields } from './eveningSnackRecipes.js';
import { planDinnerTaskFields, planLunchTaskFields } from './planMeals.js';
import { GYM_WEEK_BY_PLAN_DAY } from './beginnerGymWeek.js';
import { DEFAULT_ADMIN_USERNAME } from './ensureDefaultAdmin.js';

export const PLAN_META = [
  { day: 1, name: '体态启动日', theme: '晚间拉背，改善圆肩驼背' },
  { day: 2, name: '胸推入门日', theme: '卧推架 + 龙门架推拉平衡' },
  { day: 3, name: '腿部入门日', theme: '史密斯深蹲 + 髋外展内收' },
  { day: 4, name: '背厚背宽日', theme: '高位下拉 / 划船强化体态' },
  { day: 5, name: '胸腿综合日', theme: '卧推 + 哈克深蹲增肌' },
  { day: 6, name: '主动恢复日', theme: '轻量髋稳定 + 拉伸' },
  { day: 7, name: '全身巩固日', theme: '深蹲架/史密斯 + 推拉串练' },
];

/** 防脱用药计划仅对默认管理员账号启用 */
export const HAIR_CARE_PLAN_USERNAME = DEFAULT_ADMIN_USERNAME;

/** 一日三次用药任务标题（用于同步/去重） */
export const MEDICATION_TITLES = Object.freeze([
  '米诺地尔（晨）',
  '外用非那雄胺（午）',
  '米诺地尔（晚）',
]);

const CHECKLIST_DEFAULT = {
  1: [GYM_WEEK_BY_PLAN_DAY[1].checklist, '完成早/午/晚三餐与水果派对'],
  2: [GYM_WEEK_BY_PLAN_DAY[2].checklist, '训练注意保护与动作质量'],
  3: [GYM_WEEK_BY_PLAN_DAY[3].checklist, '保证饮水和拉伸'],
  4: [GYM_WEEK_BY_PLAN_DAY[4].checklist, '推拉平衡，注意肩胛发力'],
  5: [GYM_WEEK_BY_PLAN_DAY[5].checklist, '综合日量力而行，勿勉强大重量'],
  6: [GYM_WEEK_BY_PLAN_DAY[6].checklist, '保证睡眠≥7.5小时'],
  7: [
    GYM_WEEK_BY_PLAN_DAY[7].checklist,
    '本周运动与三餐/水果派对备货复盘',
    '周末采购：禽鱼蔬果、糙米杂粮、猕猴桃/苹果/浆果等水果 + 原味全麦饼与吐司',
  ],
};

const CHECKLIST_HAIR = {
  1: [GYM_WEEK_BY_PLAN_DAY[1].checklist, '完成早米诺、午非那、晚米诺三次用药'],
  2: [GYM_WEEK_BY_PLAN_DAY[2].checklist, '完成三次用药；训练避开用药后 4h 暴汗'],
  3: [GYM_WEEK_BY_PLAN_DAY[3].checklist, '完成三次用药'],
  4: [GYM_WEEK_BY_PLAN_DAY[4].checklist, '完成三次用药'],
  5: [GYM_WEEK_BY_PLAN_DAY[5].checklist, '完成三次用药'],
  6: [GYM_WEEK_BY_PLAN_DAY[6].checklist, '保证睡眠≥7.5小时', '完成三次用药'],
  7: [
    GYM_WEEK_BY_PLAN_DAY[7].checklist,
    '本周运动、三餐/水果派对备货与用药复盘',
    '周末采购：禽鱼蔬果、糙米杂粮、猕猴桃/苹果/浆果等水果 + 原味全麦饼与吐司',
  ],
};

function withDuration(task, planDay) {
  const d = inferDuration(task.title, task.category, planDay);
  return { ...task, durationLabel: d.durationLabel, durationMinutes: d.durationMinutes };
}

export function isHairCarePlanUsername(username) {
  return String(username || '').trim().toLowerCase() === HAIR_CARE_PLAN_USERNAME.toLowerCase();
}

/** 早晚米诺 + 午间外用非那；周末时间略顺延 */
export function getMedicationTasks(isWeekend) {
  const morning = isWeekend ? '09:00' : '08:00';
  const noon = isWeekend ? '13:00' : '12:30';
  const evening = isWeekend ? '22:00' : '21:30';

  return [
    {
      time: morning,
      category: '用药',
      title: '米诺地尔（晨）',
      description: [
        '晨间洗发并完全吹干后，涂抹约 1 mL（按说明书）。',
        '分区点涂于脱发区头皮（不是头发丝），涂匀后洗手。',
        '用药后 ≥4 小时不洗头、避免暴汗与热吹风；自然干燥。',
        '与午间非那、晚米诺均间隔 ≥4 小时。',
      ].join('\n'),
    },
    {
      time: noon,
      category: '用药',
      title: '外用非那雄胺（午）',
      description: [
        '与早米诺间隔 ≥4 小时；头皮干爽后按说明书喷数喷涂（一日仅此一次）。',
        '油/汗多时用纸巾轻拭即可，勿用水洗后再喷。',
        '可配合午休；药液干透再躺/戴帽，减少蹭掉。',
        '与晚米诺间隔 ≥4 小时；非那不必一天喷两次。',
      ].join('\n'),
    },
    {
      time: evening,
      category: '用药',
      title: '米诺地尔（晚）',
      description: [
        '头皮干燥后涂约 1 mL（与午非那间隔 ≥4 小时）；晚间一般不再洗发。',
        '操作同晨间；尽量睡前 2～3 小时上药，减少蹭枕浪费。',
        '两顿米诺间隔约 12～14 小时；过夜吸收。',
      ].join('\n'),
    },
  ];
}

function baseTasks(planDay, isWeekend, { includeHairCare = false, breakfastWeekday, teaWeekday } = {}) {
  const wake = isWeekend ? '07:30' : '06:30';
  const breakfast = isWeekend ? '08:00' : '07:00';
  const wash = isWeekend ? '07:45' : '06:45';
  const gym = GYM_WEEK_BY_PLAN_DAY[planDay];
  // 豆浆早餐 / 水果派对按日历星期（周一=1…周日=7），不跟健身 plan_day 混用
  const breakfastTask = planBreakfastTaskFields(breakfastWeekday ?? planDay);
  const lunchTask = planLunchTaskFields(planDay);
  const teaTask = planAfternoonTeaTaskFields(teaWeekday ?? breakfastWeekday ?? planDay);
  const dinnerTask = planDinnerTaskFields(planDay);
  const eveningSnackTask = planEveningSnackTaskFields(planDay);
  const lunch = '12:00';
  const afternoonTea = isWeekend ? '16:00' : '15:30';
  const dinner = '18:00';
  const checklist = includeHairCare ? CHECKLIST_HAIR : CHECKLIST_DEFAULT;

  const raw = [
    {
      time: wake,
      category: '作息',
      title: '起床饮水',
      description: includeHairCare
        ? '起床，饮水200mL；随后晨间洗发，吹干后再涂早米诺'
        : '起床，饮水200mL',
    },
  ];

  if (includeHairCare) {
    raw.push({
      time: wash,
      category: '护理',
      title: '晨间洗发',
      description: '温和洗发露清洗头皮，完全吹干后准备早米诺；一天最多洗 1 次',
    });
  }

  raw.push({
    time: breakfast,
    category: breakfastTask.category,
    title: breakfastTask.title,
    description: breakfastTask.description,
    templateKey: breakfastTask.templateKey,
    durationLabel: breakfastTask.durationLabel,
    durationMinutes: breakfastTask.durationMinutes,
  });

  if (includeHairCare) {
    const meds = getMedicationTasks(isWeekend);
    raw.push(meds[0]);
  }

  raw.push({
    time: lunch,
    category: lunchTask.category,
    title: lunchTask.title,
    description: lunchTask.description,
    templateKey: lunchTask.templateKey,
    durationLabel: lunchTask.durationLabel,
    durationMinutes: lunchTask.durationMinutes,
  });

  if (includeHairCare) {
    const meds = getMedicationTasks(isWeekend);
    raw.push(meds[1]);
  }

  raw.push(
    {
      time: afternoonTea,
      category: teaTask.category,
      title: teaTask.title,
      description: teaTask.description,
      templateKey: teaTask.templateKey,
      durationLabel: teaTask.durationLabel,
      durationMinutes: teaTask.durationMinutes,
    },
    {
      time: dinner,
      category: dinnerTask.category,
      title: dinnerTask.title,
      description: dinnerTask.description,
      templateKey: dinnerTask.templateKey,
      durationLabel: dinnerTask.durationLabel,
      durationMinutes: dinnerTask.durationMinutes,
    },
    {
      time: gym.time,
      category: '运动',
      title: gym.title,
      description: gym.description,
      durationLabel: `约 ${gym.minutes} 分钟`,
      durationMinutes: gym.minutes,
    },
    {
      time: '20:30',
      category: eveningSnackTask.category,
      title: eveningSnackTask.title,
      description: eveningSnackTask.description,
      templateKey: eveningSnackTask.templateKey,
      durationLabel: eveningSnackTask.durationLabel,
      durationMinutes: eveningSnackTask.durationMinutes,
    },
  );

  if (includeHairCare) {
    const meds = getMedicationTasks(isWeekend);
    raw.push(meds[2]);
  }

  raw.push({
    time: '23:00',
    category: '作息',
    title: '入睡',
    description: includeHairCare
      ? '放松就寝；晚米诺尽量停留后再睡，保证充足睡眠'
      : '放松就寝，保证充足睡眠',
  });

  raw.push(
    ...(checklist[planDay] || []).map((item, i) => ({
      time: '',
      category: '清单',
      title: `完成项 ${i + 1}`,
      description: item,
    })),
  );

  return raw.map((t) => {
    if (t.durationLabel) return t;
    return withDuration(t, planDay);
  });
}

/**
 * @param {number} planDay 1～7（健身轮换日，自 START_DATE 起算）
 * @param {{ includeHairCare?: boolean, date?: string, breakfastWeekday?: number, teaWeekday?: number }} [options]
 */
export function getTasksForPlanDay(planDay, options = {}) {
  const isWeekend = planDay === 6 || planDay === 7;
  const meta = PLAN_META[planDay - 1];
  const includeHairCare = Boolean(options.includeHairCare);
  const weekDay = options.breakfastWeekday
    ?? options.teaWeekday
    ?? (options.date ? weekdayMon1(options.date) : null);
  return baseTasks(planDay, isWeekend, {
    includeHairCare,
    breakfastWeekday: weekDay,
    teaWeekday: options.teaWeekday ?? weekDay,
  }).map((t, index) => ({
    ...t,
    planDay,
    planName: meta.name,
    sortOrder: index,
  }));
}

export const START_DATE = '2026-07-01';
export const SEED_DAYS = 365;

/** 日历星期：周一=1 … 周日=7（与豆浆早餐 soy-breakfast-dN 对齐） */
export function weekdayMon1(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  const js = new Date(y, m - 1, d).getDay(); // 0=周日
  return js === 0 ? 7 : js;
}

export function planDayForDate(dateStr) {
  const [sy, sm, sd] = START_DATE.split('-').map(Number);
  const [cy, cm, cd] = dateStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const current = new Date(cy, cm - 1, cd);
  const diff = Math.round((current - start) / 86400000);
  if (diff < 0) return null;
  return (diff % 7) + 1;
}
