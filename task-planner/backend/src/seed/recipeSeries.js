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
    matchPrefix: ['low-purine-', 'lunch-', 'dinner-', 'snack-', 'drink-', 'afternoon-tea-'],
  },
  {
    id: '豆浆轮换',
    label: '豆浆轮换',
    shortLabel: '豆浆',
    description: '一周豆浆配方（其他食谱页）',
    matchPrefix: ['soy-'],
  },
  {
    id: '我的定制',
    label: '我的定制',
    shortLabel: '定制',
    description: '用户私有食谱',
    matchPrefix: [],
  },
];

/** 主食谱库页展示的系列（不含豆浆轮换专页） */
export const MAIN_LIBRARY_SERIES = RECIPE_SERIES.filter((s) => s.id !== '豆浆轮换');

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
  if (recipe.source === 'custom' || (!key && recipe.source !== 'system' && recipe.source !== 'other')) {
    return '我的定制';
  }
  return '日常均衡';
}
