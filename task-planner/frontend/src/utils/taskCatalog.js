import { FITNESS_LIST } from '../data/equipment';
import {
  CITY_TRAVEL_PLANS,
  FUJIAN_CITIES,
  TRAVEL_DURATIONS,
} from '../data/travel';

/** 任务表单可选分类（含关联模块） */
export const TASK_CATEGORIES = ['作息', '早餐', '午餐', '下午茶', '晚餐', '用药', '护理', '运动', '清单', '食谱', '旅行', '自定义'];

export const TASK_SOURCES = [
  { id: 'manual', label: '手填' },
  { id: 'breakfast', label: '早餐食谱' },
  { id: 'recipe-mine', label: '食谱库' },
  { id: 'recipe-other', label: '其他食谱' },
  { id: 'equipment', label: '健身运动' },
  { id: 'travel', label: '旅行计划' },
];

/** 早餐不可手填，必须从食谱库选择 */
export const BREAKFAST_SOURCE_IDS = ['breakfast'];

function recipeCategory(mealType, recipe = {}) {
  if (mealType === '早餐') return '早餐';
  if (mealType === '午餐') return '午餐';
  if (mealType === '晚餐') return '晚餐';
  const key = recipe.templateKey || '';
  if (mealType === '加餐' && String(key).startsWith('afternoon-tea-')) return '下午茶';
  return '食谱';
}

function recipeDuration(prepMinutes) {
  if (prepMinutes == null || prepMinutes === '') return '';
  const n = Number(prepMinutes);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `约 ${n} 分钟`;
}

function recipeDescription(recipe) {
  const parts = [];
  if (recipe.mealType) parts.push(`餐次：${recipe.mealType}`);
  if (recipe.calories != null && recipe.calories !== '') parts.push(`约 ${recipe.calories} 千卡`);
  if (recipe.ingredients) {
    const lines = String(recipe.ingredients).split('\n').filter(Boolean).slice(0, 4);
    if (lines.length) parts.push(`食材：${lines.join('；')}`);
  }
  if (recipe.notes) {
    const note = String(recipe.notes).split('\n').find((line) => line.trim());
    if (note) parts.push(note.trim());
  }
  const path = recipe.source === 'other' ? `/other-recipes/${recipe.id}` : `/recipes/${recipe.id}`;
  parts.push(`详情页：${path}`);
  return parts.join('\n');
}

export function recipeToTaskFields(recipe) {
  const category = recipeCategory(recipe.mealType, recipe);
  return {
    title: recipe.title || '食谱任务',
    description: recipeDescription(recipe),
    category,
    time: '',
    durationLabel: recipeDuration(recipe.prepMinutes),
    templateKey: recipe.templateKey || null,
    sourceRef: {
      type: recipe.mealType === '早餐'
        ? 'breakfast'
        : (recipe.source === 'other' ? 'recipe-other' : 'recipe-mine'),
      id: String(recipe.id),
      label: recipe.title,
      templateKey: recipe.templateKey || null,
    },
  };
}

export function equipmentToTaskFields(item) {
  const steps = (item.howTo || []).slice(0, 3).join('；');
  const muscles = (item.muscles || []).join('、');
  const isSport = item.kind === 'sport';
  const durationBySport = {
    running: '约 30 分钟',
    swimming: '约 40 分钟',
    walking: '约 40 分钟',
  };
  return {
    title: isSport ? `有氧运动：${item.name}` : `器械训练：${item.name}`,
    description: [
      item.summary,
      muscles ? (isSport ? `侧重：${muscles}` : `主要肌群：${muscles}`) : '',
      steps ? `要点：${steps}` : '',
      `详情页：/equipment/${item.id}`,
    ].filter(Boolean).join('\n'),
    category: '运动',
    time: '',
    durationLabel: isSport
      ? (durationBySport[item.id] || '约 30 分钟')
      : '约 45 分钟',
    sourceRef: {
      type: 'equipment',
      id: item.id,
      label: item.name,
    },
  };
}

export function travelPlanToTaskFields(plan, meta = {}) {
  const cityName = meta.cityName || '';
  const durationLabel = meta.durationLabel || '';
  const spotNames = plan.days?.length
    ? plan.days.flatMap((day) => (day.spots || []).map((s) => s.name)).slice(0, 6)
    : (plan.spots || []).map((s) => s.name).slice(0, 6);

  const durationHint = {
    half: '约 5 小时',
    '1day': '约 9 小时',
    '2day': '2 天',
  }[meta.durationId] || '';

  return {
    title: [cityName, durationLabel, plan.title].filter(Boolean).join(' · '),
    description: [
      plan.summary,
      plan.route ? `路线：${plan.route}` : '',
      spotNames.length ? `景点：${spotNames.join('、')}` : '',
      plan.bestFor ? `适合：${plan.bestFor}` : '',
      '详情页：/travel',
    ].filter(Boolean).join('\n'),
    category: '旅行',
    time: '',
    durationLabel: durationHint,
    sourceRef: {
      type: 'travel',
      id: plan.id,
      label: plan.title,
    },
  };
}

export function buildEquipmentOptions() {
  return FITNESS_LIST.map((item) => ({
    id: item.id,
    label: `${item.kind === 'sport' ? '运动' : '器械'} · ${item.name}`,
    hint: item.summary,
    payload: equipmentToTaskFields(item),
  }));
}

export function buildTravelOptions() {
  const options = [];
  for (const city of FUJIAN_CITIES) {
    const byDuration = CITY_TRAVEL_PLANS[city.id];
    if (!byDuration) continue;
    for (const duration of TRAVEL_DURATIONS) {
      if (!duration.planned) continue;
      const plans = byDuration[duration.id] || [];
      for (const plan of plans) {
        options.push({
          id: plan.id,
          label: `${city.name} · ${duration.label} · ${plan.title}`,
          hint: plan.summary,
          payload: travelPlanToTaskFields(plan, {
            cityName: city.name,
            durationLabel: duration.label,
            durationId: duration.id,
          }),
        });
      }
    }
  }
  return options;
}

export function buildRecipeOptions(recipes, { mealType, series } = {}) {
  return (recipes || [])
    .filter((recipe) => !mealType || recipe.mealType === mealType)
    .filter((recipe) => !series || recipe.series === series)
    .map((recipe) => ({
      id: String(recipe.id),
      label: recipe.title,
      hint: [
        recipe.series,
        recipe.mealType,
        recipe.calories != null ? `约 ${recipe.calories} 千卡` : '',
      ].filter(Boolean).join(' · '),
      templateKey: recipe.templateKey || null,
      payload: recipeToTaskFields(recipe),
    }));
}

export function guessTaskSource(task) {
  if (!task) return 'manual';
  if (task.category === '早餐' || task.templateKey?.startsWith('low-purine-') || task.templateKey?.includes('bf-')) {
    return 'breakfast';
  }
  if (task.category === '运动' || /器械训练|有氧运动/.test(task.title || '')) return 'equipment';
  if (task.category === '旅行') return 'travel';
  if (task.category === '食谱' || task.templateKey) return 'recipe-mine';
  return 'manual';
}
