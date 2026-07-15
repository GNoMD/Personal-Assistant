/**
 * 健康计划 · 下午茶（7 日轮换）
 *
 * 定位：午后轻量加餐，以水果为主，搭配少量全麦饼干/面包；不替代正餐蛋白。
 * 原则：控制添加糖与果汁；尿酸/养发友好（浆果、猕猴桃、柑橘维 C 优先）。
 *
 * —— 每周水果备货建议（一人份参考，按冰箱冷藏 3～5 天采购）——
 * 必备：猕猴桃 4～5 个 · 苹果 4～5 个 · 鲜蓝莓或草莓 2 盒（约 250～300g）
 * 轮换：橙子或西柚 3～4 个 · 香蕉 3～4 根（训练日）· 梨 2～3 个
 * 轻食柜：原味苏打/全麦消化饼 1 小包 · 全麦吐司半袋（冷冻分片更耐放）
 * 少买：果汁饮料、夹心甜饼、奶油蛋糕（血糖与头皮油脂负担更大）
 */

const FRUIT_PREP_TIP = [
  '冷藏浆果 2～3 天内吃完；猕猴桃常温催熟后冷藏；香蕉勿冷藏；吐司可冷冻按片取用。',
  '当天上午或前一晚洗净擦干装盒，下午直接开吃，减少临时凑合买奶茶甜点。',
].join('');

function teaNotes({ efficacy, nutrients, effects, calories, tip }) {
  return [
    `功效：${efficacy}`,
    `补什么：${nutrients}`,
    `作用：${effects}`,
    `营养：参考热量约 ${calories} 千卡。`,
    `贴士：${tip || FRUIT_PREP_TIP}`,
    '说明：下午茶为轻量加餐，不替代正餐蛋白；少果汁甜点。',
  ].join('\n');
}

export const AFTERNOON_TEA_RECIPES = [
  {
    templateKey: 'afternoon-tea-d1',
    planDay: 1,
    title: '下午茶｜蓝莓全麦薄饼',
    mealType: '加餐',
    ingredients: [
      '水果｜鲜蓝莓 100～120g（约大半杯）｜约 55～65 千卡',
      '轻食｜全麦薄脆/消化饼 2 片（约 20g）｜约 80 千卡',
      '饮品｜温开水或淡柠檬水 200mL｜约 0 千卡',
    ].join('\n'),
    steps: [
      '蓝莓冷水冲洗，沥干；异味果挑出。',
      '饼干原味、低糖；不配果酱或炼乳。',
      '15:30 左右食用，用餐时间控制在 10～15 分钟。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '浆果多酚 + 全麦碳水，适合启动日午后续航',
      nutrients: '蓝莓花青素与维C、全麦复合碳水与膳食纤维',
      effects: '稳住血糖、减少奶茶甜点冲动，补充抗氧化营养',
      calories: '140～150',
    }),
    prepMinutes: 10,
    calories: 145,
    tags: '下午茶,加餐,水果,全麦,尿酸友好,养发',
  },
  {
    templateKey: 'afternoon-tea-d2',
    planDay: 2,
    title: '下午茶｜猕猴桃苏打饼干',
    mealType: '加餐',
    ingredients: [
      '水果｜猕猴桃 1 个中等（约 100～120g 可食部）｜约 55 千卡',
      '轻食｜原味苏打饼干 3～4 小片（约 18g）｜约 70 千卡',
      '饮品｜温开水 200mL｜约 0 千卡',
    ].join('\n'),
    steps: [
      '猕猴桃洗净，切半挖勺或去皮切片。',
      '苏打饼干限量；手痒想续杯时再加半个猕猴桃，不加倍饼干。',
      '维 C 丰富，有助于铁吸收；避免同时大口喝浓茶。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '猕猴桃维C午点，搭配低负担苏打饼干',
      nutrients: '维C、膳食纤维；少量全谷物碳水',
      effects: '促进铁吸收、支持养发营养，替代含糖饮料',
      calories: 125,
    }),
    prepMinutes: 8,
    calories: 125,
    tags: '下午茶,加餐,猕猴桃,维C,尿酸友好,养发',
  },
  {
    templateKey: 'afternoon-tea-d3',
    planDay: 3,
    title: '下午茶｜苹果全麦小餐包',
    mealType: '加餐',
    ingredients: [
      '水果｜富士/黄蕉等苹果 1 个中等（约 180g）｜约 95 千卡',
      '轻食｜全麦小餐包/小面包半个（约 30～35g）｜约 80 千卡',
      '可选｜原味杏仁 5g（约 4～5 粒，发作期可省略）｜约 30 千卡',
    ].join('\n'),
    steps: [
      '苹果洗净，连皮吃更饱腹；切开可喷一点柠檬防氧化。',
      '面包选无糖精、无奶油夹心款；烤箱或平底锅微热更香。',
      '杏仁严格限量，不要一把抓。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '苹果纤维饱腹，少量全麦面包垫饥',
      nutrients: '果胶与膳食纤维、复合碳水；可选限量杏仁健康脂肪',
      effects: '腿训日控制零食冲动，延长饱腹、减少血糖起伏',
      calories: '175～200（含杏仁）',
    }),
    prepMinutes: 10,
    calories: 185,
    tags: '下午茶,加餐,苹果,全麦,尿酸友好',
  },
  {
    templateKey: 'afternoon-tea-d4',
    planDay: 4,
    title: '下午茶｜草莓消化饼',
    mealType: '加餐',
    ingredients: [
      '水果｜草莓 120～150g（约 8～10 颗中等）｜约 40～50 千卡',
      '轻食｜全麦消化饼 2 片（约 20g）｜约 80 千卡',
      '饮品｜温开水 200mL｜约 0 千卡',
    ].join('\n'),
    steps: [
      '草莓蒂拔掉后冲洗沥干；切开配饼干更易控制份量。',
      '不刷炼乳、不撒糖粉。',
      '草莓不耐放，到家 1～2 天内优先吃完。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '低热量草莓午点，背训日也稳得住',
      nutrients: '草莓维C与多酚、全麦消化饼复合碳水',
      effects: '替代奶茶甜食，补充微量营养与轻量能量',
      calories: 130,
    }),
    prepMinutes: 8,
    calories: 130,
    tags: '下午茶,加餐,草莓,全麦,养发,尿酸友好',
  },
  {
    templateKey: 'afternoon-tea-d5',
    planDay: 5,
    title: '下午茶｜香蕉橙瓣全麦吐司',
    mealType: '加餐',
    ingredients: [
      '水果｜香蕉半根至大半根（约 60～80g）｜约 55～70 千卡',
      '水果｜橙子或血橙 ½～1 个（约 100～150g 果肉）｜约 45～70 千卡',
      '轻食｜全麦吐司 ½ 片（约 15g）｜约 40 千卡',
    ].join('\n'),
    steps: [
      '训练日建议安排在出门前 45～60 分钟，补充易用碳水。',
      '香蕉勿整根大吃，半根够用；橙肉去白络亦可。',
      '吐司烤箱微烤；不涂黄油果酱。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '训练日前轻碳水续航',
      nutrients: '香蕉快碳、柑橘维C、少量全麦吐司',
      effects: '出门前 45～60 分钟补能，兼顾铁吸收支持',
      calories: '150～170',
    }),
    prepMinutes: 10,
    calories: 160,
    tags: '下午茶,加餐,香蕉,柑橘,训练日,养发',
  },
  {
    templateKey: 'afternoon-tea-d6',
    planDay: 6,
    title: '下午茶｜梨片原味饼干',
    mealType: '加餐',
    ingredients: [
      '水果｜梨 1 个中小（约 200g）｜约 80～90 千卡',
      '轻食｜原味饼干 2 片（约 16g）｜约 60 千卡',
      '饮品｜温开水 250mL｜约 0 千卡',
    ].join('\n'),
    steps: [
      '梨洗净切片；偏硬可室温再放半天。',
      '恢复日份量可略保守，饥饿感不强时只吃梨也行。',
      '不搭配冰淇淋或珍珠奶茶。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '清爽低负担梨片午点，适合主动恢复日',
      nutrients: '梨的水分与纤维、少量原味饼干碳水',
      effects: '胃肠轻松、控热量，减少恢复日零食升级',
      calories: '140～150',
    }),
    prepMinutes: 8,
    calories: 145,
    tags: '下午茶,加餐,梨,恢复日,尿酸友好',
  },
  {
    templateKey: 'afternoon-tea-d7',
    planDay: 7,
    title: '下午茶｜柑橘莓果面包卷',
    mealType: '加餐',
    ingredients: [
      '水果｜橙子段或西柚瓣 120g｜约 50 千卡',
      '水果｜蓝莓或草莓 60g｜约 30 千卡',
      '轻食｜全麦小面包卷半个或吐司 ½ 片（约 25g）｜约 65 千卡',
    ].join('\n'),
    steps: [
      '柑橘剥好去籽；浆果洗净。',
      '面包卷微热后与水果同盘，细嚼慢咽。',
      '本周复盘：冰箱是否还有剩余浆果/猕猴桃，下周日采买时按备货清单补货。',
    ].join('\n'),
    notes: teaNotes({
      efficacy: '一周收官：柑橘维C + 浆果多酚 + 少量全麦',
      nutrients: '维C、花青素/多酚、全麦复合碳水',
      effects: '收束本周抗氧化与控糖目标，复盘备果是否齐全',
      calories: 145,
      tip: `${FRUIT_PREP_TIP} 每周采购优先：猕猴桃、苹果、浆果、柑橘、香蕉（训练日）、梨；轻食柜只备原味全麦饼与吐司。`,
    }),
    prepMinutes: 12,
    calories: 145,
    tags: '下午茶,加餐,柑橘,浆果,全麦,养发',
  },
];

export function getPlanAfternoonTeaRecipe(planDay) {
  return AFTERNOON_TEA_RECIPES.find((r) => r.planDay === Number(planDay)) || null;
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
  parts.push('来源：食谱库 · 健康计划下午茶');
  parts.push('餐次：下午茶（加餐）');
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
    durationLabel: prepMinutes ? `约 ${prepMinutes} 分钟` : '约 10 分钟',
    durationMinutes: prepMinutes != null && prepMinutes !== '' ? Number(prepMinutes) : 10,
  };
}

export function planAfternoonTeaTaskFields(planDay) {
  const recipe = getPlanAfternoonTeaRecipe(planDay);
  if (!recipe) {
    throw new Error(`未找到计划第 ${planDay} 天对应的下午茶食谱`);
  }
  return buildAfternoonTeaTaskContent(recipe);
}

/** 每周水果/轻食备货清单（便于清单任务或说明引用） */
export const WEEKLY_FRUIT_SHOPPING = [
  '猕猴桃 4～5 个（常温催熟后冷藏）',
  '苹果 4～5 个',
  '蓝莓或草莓 2 盒（约 250～300g，优先吃完）',
  '橙子或西柚 3～4 个',
  '香蕉 3～4 根（训练日；勿整把冷藏）',
  '梨 2～3 个',
  '原味苏打/全麦消化饼 1 小包 + 全麦吐司（可冷冻按片）',
];
