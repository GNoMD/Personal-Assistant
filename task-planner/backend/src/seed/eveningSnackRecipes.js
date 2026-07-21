/**
 * 练后轻夜宵（晚练日 · 按健身 plan_day 轮换）
 * 对齐《一人份一周豆浆早餐配方》第 13 节：控尿酸 · 养胃 · 增肌 · 安神
 * 定位：练后正餐的补充，非第二顿晚餐；无乳糖无糖优先。
 */

const SNACK_COMMON = [
  '【时间】约 20:15～20:45，练后正餐同时或紧随其后；最晚 21:00 前吃完。',
  '【红线】无乳糖无糖；不加蜂蜜/果酱/奶茶；不替代练后正餐的掌心大蛋白。',
  '【睡眠】睡前 2 小时不再进食；与豆浆一样不在深夜猛灌。',
  '【保存】酸奶冷藏，开封 2～3 天内吃完；鸡蛋煮好密封冷藏 2 天。',
].join('\n');

function snackNotes({ efficacy, protein, calories, tip }) {
  return [
    `功效：${efficacy}`,
    `蛋白约 ${protein}；参考 ${calories} 千卡。`,
    tip ? `贴士：${tip}` : '',
    SNACK_COMMON,
  ].filter(Boolean).join('\n');
}

/** planDay 1～7，对应 PLAN_META / 当晚训练主题 */
export const EVENING_SNACK_RECIPES = [
  {
    templateKey: 'night-snack-d1',
    planDay: 1,
    title: '练后轻夜宵｜酸奶蓝莓杯',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 150g',
      '蓝莓 30～50g（可与上午/水果派对不重复采购）',
    ].join('\n'),
    steps: [
      '练后正餐先吃掌心大蛋白+蔬菜；仍饿再本加餐。',
      '酸奶铺蓝莓，不另加糖。',
      '启动日消耗中等，轻量即可。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '拉背启动日：补充蛋白与抗氧化，稳血糖',
      protein: '10～12g',
      calories: '110～130',
    }),
    prepMinutes: 5,
    calories: 120,
    tags: '夜宵,练后,酸奶,乳糖友好,增肌',
  },
  {
    templateKey: 'night-snack-d2',
    planDay: 2,
    title: '练后轻夜宵｜酸奶+水煮蛋',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 150g',
      '水煮蛋 1 个（早餐已有 2 个时，这里可改 1 个蛋清）',
    ].join('\n'),
    steps: [
      '胸推日略增蛋白；先完成练后正餐。',
      '鸡蛋提前煮好，练后取冷藏即可。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '胸推日：优质蛋白双来源，利于恢复',
      protein: '16～18g',
      calories: '155～165',
      tip: '早餐已 2 全蛋时，本项改 150g 酸奶 + 2 个蛋清即可。',
    }),
    prepMinutes: 5,
    calories: 160,
    tags: '夜宵,练后,酸奶,鸡蛋,增肌',
  },
  {
    templateKey: 'night-snack-d3',
    planDay: 3,
    title: '练后轻夜宵｜酸奶香蕉半根',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 200g',
      '香蕉 半根（约 50～60g）',
    ].join('\n'),
    steps: [
      '腿部大消耗日：练后补一点快碳+蛋白。',
      '若 17:30 练前已吃半根香蕉，这里改 200g 酸奶 + 1 个水煮蛋，不再加香蕉。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '腿训日：恢复糖原 + 蛋白，减次日酸痛感',
      protein: '12～14g',
      calories: '180～200',
    }),
    prepMinutes: 5,
    calories: 190,
    tags: '夜宵,练后,酸奶,香蕉,增肌',
  },
  {
    templateKey: 'night-snack-d4',
    planDay: 4,
    title: '练后轻夜宵｜温酸奶',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 150g（提前取出回温，勿冰饮）',
    ].join('\n'),
    steps: [
      '养胃日：酸奶勿冰、不加果；反酸明显时改 150g 温酸奶 + 1 个水煮蛋。',
      '配合四神豆浆日，晚间同样温和；下午水果派对半根+练前半根，夜宵不再叠果。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '背训+养胃日：低酸、小份量，不刺激反酸',
      protein: '10～12g',
      calories: '90～110',
      tip: '周四为豆浆「四神养胃」日，夜宵也偏温和。',
    }),
    prepMinutes: 5,
    calories: 100,
    tags: '夜宵,练后,酸奶,养胃,乳糖友好',
  },
  {
    templateKey: 'night-snack-d5',
    planDay: 5,
    title: '练后轻夜宵｜酸奶双蛋白',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 200g',
      '水煮蛋 1 个',
    ].join('\n'),
    steps: [
      '胸腿综合日：消耗最大，练后蛋白略加强。',
      '仍靠正餐为主；本项为「还饿才吃」。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '综合大日：拉高练后蛋白，服务增肌',
      protein: '18～20g',
      calories: '230～240',
      tip: '与周五豆浆「蛋白日」呼应；勿再叠加蛋白粉。',
    }),
    prepMinutes: 5,
    calories: 235,
    tags: '夜宵,练后,酸奶,鸡蛋,增肌',
  },
  {
    templateKey: 'night-snack-d6',
    planDay: 6,
    title: '练后轻夜宵｜可选小杯酸奶',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 100～150g（可选）',
      '或：不额外加餐，仅练后正餐',
    ].join('\n'),
    steps: [
      '主动恢复日：训练轻、消耗小，**不饿就跳过**本项。',
      '若练后仍饿：小杯酸奶即可，不加水果不加蛋。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '恢复日：给肠胃和尿酸减负，不硬补',
      protein: '6～10g（若吃）',
      calories: '60～90（若吃）',
      tip: '周六豆浆含少量绿豆/花生，晚间更宜从简。',
    }),
    prepMinutes: 3,
    calories: 75,
    tags: '夜宵,练后,酸奶,恢复日,可选',
  },
  {
    templateKey: 'night-snack-d7',
    planDay: 7,
    title: '练后轻夜宵｜酸奶猕猴桃',
    mealType: '加餐',
    series: '练后轻夜宵',
    ingredients: [
      '无乳糖无糖酸奶 150g',
      '猕猴桃 ½ 个（约 40～50g）',
    ].join('\n'),
    steps: [
      '全身巩固日：维 C + 蛋白，收尾一周训练。',
      '猕猴桃需软熟；与护肾无杂豆日不冲突。',
    ].join('\n'),
    notes: snackNotes({
      efficacy: '巩固日：轻蛋白 + 维C，养发向补充',
      protein: '10～12g',
      calories: '130～145',
    }),
    prepMinutes: 5,
    calories: 138,
    tags: '夜宵,练后,酸奶,猕猴桃,养发',
  },
];

export function getPlanEveningSnackRecipe(planDay) {
  return EVENING_SNACK_RECIPES.find((r) => r.planDay === Number(planDay)) || null;
}

export function buildEveningSnackTaskContent(recipe, opts = {}) {
  const templateKey = recipe.templateKey || recipe.template_key;
  const ingredients = String(recipe.ingredients || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const steps = String(recipe.steps || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const notes = String(recipe.notes || '').trim();
  const calories = recipe.calories;
  const prepMinutes = recipe.prepMinutes ?? recipe.prep_minutes ?? null;

  const parts = [];
  parts.push('来源：健康计划 · 练后轻夜宵');
  if (calories != null && calories !== '') parts.push(`约 ${calories} 千卡`);
  parts.push('餐次：夜宵（练后补充）');
  if (ingredients.length) {
    parts.push(`食材：\n${ingredients.map((line) => `· ${line}`).join('\n')}`);
  }
  if (steps.length) {
    parts.push(`步骤：\n${steps.map((line, i) => `${i + 1}. ${line}`).join('\n')}`);
  }
  if (notes) parts.push(`说明：${notes}`);
  if (opts.recipeId) parts.push(`详情页：/recipes/${opts.recipeId}`);

  return {
    title: recipe.title,
    description: parts.join('\n\n'),
    category: '夜宵',
    templateKey,
    durationLabel: prepMinutes ? `约 ${prepMinutes} 分钟` : '约 5 分钟',
    durationMinutes: prepMinutes != null && prepMinutes !== '' ? Number(prepMinutes) : 5,
  };
}

export function planEveningSnackTaskFields(planDay) {
  const recipe = getPlanEveningSnackRecipe(planDay);
  if (!recipe) {
    throw new Error(`未找到计划第 ${planDay} 天对应的练后轻夜宵（night-snack-d${planDay}）`);
  }
  return buildEveningSnackTaskContent(recipe);
}

export const WEEKLY_EVENING_SNACK_SHOPPING = [
  '无乳糖无糖酸奶 7～10 小杯/盒（150～200g/次，恢复日可少买）',
  '鸡蛋（与早餐共用，另备 2～3 个专练后）',
  '蓝莓/猕猴桃/橙子（与水果派对统筹，避免重复浪费）',
  '香蕉 2～3 根（练前每日 1 根；周四派对+练前各半根）',
];
