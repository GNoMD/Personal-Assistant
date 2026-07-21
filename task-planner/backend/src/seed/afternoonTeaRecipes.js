/**
 * 健康计划 · 水果派对（原下午茶时段）
 *
 * 按日历星期轮换，与《一人份一周豆浆早餐配方》第 10 节水果搭配一致：
 * 控尿酸 · 健脾养胃 · 养发安神 · 稳糖轻体。
 * 整果、不榨汁、不加糖；不替代正餐蛋白。
 */

const FRUIT_PREP_TIP = [
  '冷藏浆果 2～3 天内吃完；猕猴桃硬果常温催熟、软后冷藏；香蕉勿整根冷藏；梨/苹果常温或冷藏均可。',
  '浆果类吃前再洗；已切开密封冷藏尽量当天吃完。禁止果汁、奶茶、果干当「水果份」。',
].join('');

/** 写入任务说明的保存摘要（与文档 10.5 一致） */
const FRUIT_STORAGE = {
  blueberry: '保存：冷藏首选，原盒垫纸吸潮、吃前再洗；冷藏约 2～3 天。常温仅当天。',
  apple: '保存：阴凉常温约 5～7 天，或冷藏保鲜袋 1～2 周；切开密封冷藏当天吃。',
  pear: '保存：阴凉常温约 3～5 天，或冷藏约 1 周；偏硬可常温再放软。',
  banana: '保存：必须常温；青黄约 2～4 天，全黄后 1～2 天内吃。勿整根冷藏（皮易黑）。',
  kiwi: '保存：硬果常温催熟约 2～5 天；软熟后冷藏约 3～5 天。想慢熟可硬果直接冷藏。',
  peach: '保存：硬桃常温催熟 1～3 天；软熟后冷藏 2～3 天尽快吃。易碰伤。',
  orange: '保存：阴凉常温约 5～7 天，或冷藏 1～2 周；切开密封冷藏当天吃。',
};

function fruitNotes({ efficacy, nutrients, effects, calories, tip, storage }) {
  const lines = [
    `功效：${efficacy}`,
    `补什么：${nutrients}`,
    `作用：${effects}`,
    `营养：参考热量约 ${calories} 千卡。`,
  ];
  if (storage) lines.push(`保存：${storage}`);
  lines.push(`贴士：${tip || FRUIT_PREP_TIP}`);
  lines.push('说明：水果派对为轻量加餐，与豆浆早餐主题互补；整果一次吃完，不替代正餐蛋白。');
  return lines.join('\n');
}

/** planDay / weekDayMon1：周一=1 … 周日=7 */
export const AFTERNOON_TEA_RECIPES = [
  {
    templateKey: 'fruit-party-d1',
    planDay: 1,
    title: '水果派对｜蓝莓',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '鲜蓝莓 80～100g（约半杯）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '蓝莓冷水冲洗沥干，异味果挑出（吃前再洗，勿提前洗净存放）。',
      '15:30～16:00 整果食用，不撒糖、不配炼乳。',
      '与豆浆「养发安神」日互补：浆果多酚 + 低 GI。',
      FRUIT_STORAGE.blueberry,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周一养发向：浆果抗氧化，搭豆浆黑米芝麻不扎堆',
      nutrients: '花青素、维C、膳食纤维',
      effects: '稳糖、减甜点冲动，支持养发营养',
      calories: '45～55',
      storage: '冷藏首选（原盒垫纸、吃前再洗）约 2～3 天；常温仅当天。已切开密封冷藏当天吃。',
    }),
    prepMinutes: 5,
    calories: 50,
    tags: '水果派对,加餐,蓝莓,尿酸友好,养发',
  },
  {
    templateKey: 'fruit-party-d2',
    planDay: 2,
    title: '水果派对｜苹果',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '苹果 1 个（约 180g，可去皮）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '洗净；胃弱可去皮或切块细嚼。',
      '搭配豆浆「健脾固肾」日：果胶护肠，不打架。',
      '不榨汁、不配甜酱。',
      FRUIT_STORAGE.apple,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周二健脾向：果胶温和护肠',
      nutrients: '果胶、膳食纤维、钾',
      effects: '延长饱腹、减少乱吃，肠胃友好',
      calories: '90～100',
      storage: '阴凉常温约 5～7 天，或冷藏保鲜袋 1～2 周；切开后密封冷藏当天吃。',
    }),
    prepMinutes: 5,
    calories: 95,
    tags: '水果派对,加餐,苹果,健脾,尿酸友好',
  },
  {
    templateKey: 'fruit-party-d3',
    planDay: 3,
    title: '水果派对｜梨',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '梨 1 个（约 180～200g）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '洗净直接吃；胃弱可去皮或切块细嚼。',
      '呼应豆浆「利水轻体」日：清润补水。',
      `梨：${FRUIT_STORAGE.pear}`,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周三利水向：清润、水分足',
      nutrients: '水分、纤维、钾（适量）',
      effects: '清口减黏腻感，配合赤小豆茯苓主题',
      calories: '80～90',
      storage: '梨：阴凉常温 3～5 天或冷藏约 1 周；一人份更容易控量，也更耐放。',
    }),
    prepMinutes: 5,
    calories: 85,
    tags: '水果派对,加餐,梨,利水,尿酸友好',
  },
  {
    templateKey: 'fruit-party-d4',
    planDay: 4,
    title: '水果派对｜香蕉',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '香蕉 1 根（约 100～120g，七成熟）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '养胃日首选：少酸、温和；勿换酸橙/青柠。',
      '配豆浆「四神养胃」日；反酸时细嚼慢咽。',
      '若当晚练前要用半根香蕉，下午只吃半根，避免一天两根堆糖。',
      FRUIT_STORAGE.banana,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周四养胃向：少酸刺激、易消化',
      nutrients: '钾、易用碳水、少量纤维',
      effects: '护胃加餐，减少烧心日乱吃',
      calories: '90～110',
      storage: '必须常温；青黄约 2～4 天，全黄后 1～2 天内吃。勿整根冷藏；与催熟水果分开放。',
    }),
    prepMinutes: 3,
    calories: 100,
    tags: '水果派对,加餐,香蕉,养胃',
  },
  {
    templateKey: 'fruit-party-d5',
    planDay: 5,
    title: '水果派对｜猕猴桃',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '猕猴桃 1 个（约 80～100g 可食部）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '洗净，切半挖勺或去皮切片；偏硬可常温再放半天。',
      '配豆浆「蛋白增肌养发」日：维 C 互补，不与周一蓝莓扎堆。',
      '胃酸敏感者可换成蓝莓 80～100g，或苹果半个。',
      FRUIT_STORAGE.kiwi,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周五增肌养发向：维 C 丰富',
      nutrients: '维C、纤维、叶酸',
      effects: '助植物蛋白日营养利用感，替代甜饮',
      calories: '50～60',
      storage: '硬果常温催熟 2～5 天；软熟后冷藏 3～5 天。想慢熟可硬果直接冷藏。',
    }),
    prepMinutes: 5,
    calories: 55,
    tags: '水果派对,加餐,猕猴桃,维C,养发,尿酸友好',
  },
  {
    templateKey: 'fruit-party-d6',
    planDay: 6,
    title: '水果派对｜桃或梨',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '桃或梨 1 个（约 150～200g）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '清暑日：桃/梨二选一；胃弱优先梨。',
      '配豆浆「清暑健脾」日，呼应绿豆清火。',
      '不配冰淇淋、奶茶。',
      `桃：${FRUIT_STORAGE.peach}`,
      `梨：${FRUIT_STORAGE.pear}`,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周六清暑向：润燥清口',
      nutrients: '水分、纤维',
      effects: '清暑减上火感，低负担加餐',
      calories: '70～90',
      storage: '桃：硬桃常温催熟 1～3 天，软熟后冷藏 2～3 天。梨：常温 3～5 天或冷藏约 1 周。',
    }),
    prepMinutes: 5,
    calories: 80,
    tags: '水果派对,加餐,桃,梨,清暑,尿酸友好',
  },
  {
    templateKey: 'fruit-party-d7',
    planDay: 7,
    title: '水果派对｜橙子',
    mealType: '加餐',
    series: '水果派对',
    ingredients: [
      '橙子 1 个（约 150～180g）',
      '温开水 200mL（可选）',
    ].join('\n'),
    steps: [
      '洗净，剥皮或切半挖勺；一人刚好一只，好控量。',
      '配豆浆「无杂豆护肾」日：维 C 低负担，肾脏缓冲日加分。',
      '本周复盘：下周按备货清单补蓝莓/猕猴桃/苹果等。',
      `橙子：${FRUIT_STORAGE.orange}`,
    ].join('\n'),
    notes: fruitNotes({
      efficacy: '周日护肾向：一人一只好控量，维 C 不贵也不娇气',
      nutrients: '维C、纤维、叶酸',
      effects: '给代谢减负日加维 C，不冲尿酸红线；比浆果耐放、更省钱',
      calories: '60～70',
      storage: '阴凉常温约 5～7 天，或冷藏 1～2 周；切开密封冷藏当天吃。',
      tip: `${FRUIT_PREP_TIP} 一周采购：蓝莓、苹果、梨、香蕉、猕猴桃、桃、橙子各约 1 日份。`,
    }),
    prepMinutes: 5,
    calories: 65,
    tags: '水果派对,加餐,橙子,护肾,尿酸友好',
  },
];

/** @param {number} weekDayMon1 日历星期 1=周一 … 7=周日 */
export function getPlanAfternoonTeaRecipe(weekDayMon1) {
  return AFTERNOON_TEA_RECIPES.find((r) => r.planDay === Number(weekDayMon1)) || null;
}

export function buildAfternoonTeaTaskContent(recipe, opts = {}) {
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
  parts.push('来源：食谱库 · 健康计划水果派对（原下午茶时段）');
  parts.push('餐次：水果派对（加餐）');
  if (calories != null && calories !== '') parts.push(`约 ${calories} 千卡`);
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
    category: '下午茶',
    templateKey,
    durationLabel: prepMinutes ? `约 ${prepMinutes} 分钟` : '约 5 分钟',
    durationMinutes: prepMinutes != null && prepMinutes !== '' ? Number(prepMinutes) : 5,
  };
}

/** @param {number} weekDayMon1 日历星期 1=周一 … 7=周日 */
export function planAfternoonTeaTaskFields(weekDayMon1) {
  const recipe = getPlanAfternoonTeaRecipe(weekDayMon1);
  if (!recipe) {
    throw new Error(`未找到星期 ${weekDayMon1} 对应的水果派对食谱（fruit-party-d${weekDayMon1}）`);
  }
  return buildAfternoonTeaTaskContent(recipe);
}

/** 每周水果备货清单（一人份，含保存要点） */
export const WEEKLY_FRUIT_SHOPPING = [
  '蓝莓 80～100g（周一）｜冷藏 2～3 天，吃前再洗',
  '苹果 1 个（周二）｜常温 5～7 天或冷藏 1～2 周',
  '梨 1～2 个（周三、周六）｜常温 3～5 天或冷藏约 1 周',
  '香蕉 1 根（周四）｜必须常温，勿冷藏；青黄 2～4 天',
  '猕猴桃 1 个（周五）｜硬果常温催熟，软后冷藏 3～5 天',
  '桃或梨 1 个（周六）｜硬桃常温催熟；梨见上',
  '橙子 1 个（周日）｜常温 5～7 天或冷藏 1～2 周',
];
