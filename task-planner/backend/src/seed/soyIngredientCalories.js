/**
 * 豆浆干料 / 早餐配餐参考热量（千卡/100g）
 * 用于一人份豆浆早餐、豆浆轮换等食谱的参考千卡。
 */
export const SOY_DRY_KCAL_PER_100G = Object.freeze({
  绿心豆: 381,
  黑豆: 381,
  黄豆: 390,
  红腰豆: 333,
  赤小豆: 309,
  鹰嘴豆: 364,
  绿豆: 316,
  炒白扁豆: 326,
  白扁豆: 326,
  燕麦片: 367,
  裸燕麦米: 367,
  黑米: 341,
  红米: 348,
  小米: 358,
  糙米: 348,
  藜麦: 368,
  黑芝麻: 531,
  核桃: 627,
  花生: 563,
  去芯莲子: 344,
  莲子: 344,
  干百合: 323,
  百合: 323,
  山药干: 303,
  芡实: 351,
  茯苓: 200,
  陈皮: 260,
  // 早餐配餐（可食部约值）
  玉米: 106,
  全麦面包: 246,
  黄瓜: 16,
  小番茄: 22,
  樱桃番茄: 22,
  牛油果: 160,
  杏仁: 578,
  核桃仁: 627,
});

/** 标准水煮蛋（约 50～55g）参考热量 */
export const BOILED_EGG_KCAL = 78;

const AMOUNT_RE = /(\d+(?:\.\d+)?)\s*g/;

/**
 * 从「绿心豆 6g（原黑豆）」这类行解析名称与克数
 * @param {string} line
 * @returns {{ name: string, grams: number } | null}
 */
export function parseSoyIngredientLine(line) {
  const text = String(line || '').trim();
  if (!text || /清水|水约|ml|毫升|水煮蛋/i.test(text)) return null;
  const amount = text.match(AMOUNT_RE);
  if (!amount) return null;
  const grams = Number(amount[1]);
  if (!Number.isFinite(grams) || grams <= 0) return null;

  const namePart = text.slice(0, amount.index).trim().replace(/[（(].*$/, '').trim();
  const keys = Object.keys(SOY_DRY_KCAL_PER_100G).sort((a, b) => b.length - a.length);
  const name = keys.find((k) => namePart.includes(k));
  if (!name) return null;
  return { name, grams };
}

/**
 * @param {string[]|string} ingredients
 * @returns {{ dryKcal: number, unknown: string[] }}
 */
export function estimateSoyDryCalories(ingredients) {
  const lines = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients || '').split('\n');
  let dryKcal = 0;
  const unknown = [];
  for (const line of lines) {
    const parsed = parseSoyIngredientLine(line);
    if (!parsed) {
      const t = String(line || '').trim();
      if (t && !/清水|水约|ml|毫升|水煮蛋/i.test(t) && AMOUNT_RE.test(t)) unknown.push(t);
      continue;
    }
    const per100 = SOY_DRY_KCAL_PER_100G[parsed.name];
    dryKcal += (per100 * parsed.grams) / 100;
  }
  return { dryKcal: Math.round(dryKcal), unknown };
}

/**
 * 豆浆早餐展示热量：干料/配餐 + 水煮蛋
 * @param {string[]|string} ingredients
 * @param {{ eggCount?: number }} [opts]
 */
export function estimateSoyBreakfastCalories(ingredients, opts = {}) {
  const eggCount = opts.eggCount != null ? Number(opts.eggCount) : 2;
  const { dryKcal, unknown } = estimateSoyDryCalories(ingredients);
  const eggKcal = Math.max(0, eggCount) * BOILED_EGG_KCAL;
  const total = dryKcal + eggKcal;
  const calories = Math.round(total / 5) * 5;
  return { calories, dryKcal, eggKcal, eggCount, unknown };
}
