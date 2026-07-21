/**
 * 系统食谱系列（类别）
 * - series 写入 recipes.series
 * - 前端按系列筛选浏览
 */

export const RECIPE_SERIES = [
  {
    id: '防脱养发',
    label: '防脱养发',
    shortLabel: '防脱',
    description: '毛囊营养、控油清淡、支持外用药疗程',
    matchPrefix: ['hair-care-'],
  },
  {
    id: 'AGA增肌',
    label: 'AGA增肌',
    shortLabel: '增肌',
    description: '配合米诺/非那 + 力量训练的高蛋白方案',
    matchPrefix: ['aga-muscle-'],
  },
  {
    id: '日常均衡',
    label: '日常均衡',
    shortLabel: '日常',
    description: '尿酸友好、乳糖友好与基础三餐饮品',
    matchPrefix: ['low-purine-', 'lunch-', 'dinner-', 'snack-', 'drink-', 'afternoon-tea-', 'soy-breakfast-'],
  },
  {
    id: '豆浆轮换',
    label: '豆浆轮换',
    shortLabel: '豆浆',
    description: '一周7天豆浆配方（1200ml水/4人份）',
    matchPrefix: ['soy-week-'],
  },
  {
    id: '豆浆早餐',
    label: '豆浆早餐',
    shortLabel: '豆浆早',
    description: '一人份早餐豆浆一周轮换（约550ml）',
    matchPrefix: ['soy-breakfast-'],
  },
  {
    id: '水果派对',
    label: '水果派对',
    shortLabel: '水果',
    description: '下午茶时段整果轮换，与豆浆早餐主题互补',
    matchPrefix: ['fruit-party-'],
  },
  {
    id: '练后轻夜宵',
    label: '练后轻夜宵',
    shortLabel: '夜宵',
    description: '晚练后无乳糖酸奶/蛋等轻补充',
    matchPrefix: ['night-snack-'],
  },
  {
    id: '我的定制',
    label: '我的定制',
    shortLabel: '定制',
    description: '用户私有食谱',
    matchPrefix: [],
  },
];

/** 主食谱库页展示的系列 */
export const MAIN_LIBRARY_SERIES = RECIPE_SERIES.filter((s) => s.id !== '我的定制');

export function resolveRecipeSeries(recipe = {}) {
  if (recipe.series && String(recipe.series).trim()) {
    return String(recipe.series).trim();
  }
  const key = recipe.templateKey || recipe.template_key || '';
  for (const series of RECIPE_SERIES) {
    if (series.matchPrefix.some((prefix) => key.startsWith(prefix))) {
      return series.id;
    }
  }
  if (recipe.source === 'custom' || (!key && recipe.source !== 'system')) {
    return '我的定制';
  }
  return '日常均衡';
}
