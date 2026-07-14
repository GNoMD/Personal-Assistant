/**
 * Parse structured meal lines:
 *   主食｜糙米饭 150g｜约 170 千卡
 * Falls back gracefully for plain ingredient lines.
 */

const DISH_LINE_RE = /^([^｜|]+)[｜|]([^｜|]+?)(?:[｜|]\s*约?\s*(\d+)\s*千卡)?\s*$/;
const CAL_ONLY_RE = /约?\s*(\d+)\s*千卡/;

export function parseDishLine(line) {
  const text = String(line || '').trim();
  if (!text) return null;

  const matched = text.match(DISH_LINE_RE);
  if (matched) {
    const category = matched[1].trim();
    const name = matched[2].trim();
    const calories = matched[3] ? Number(matched[3]) : null;
    // If first segment looks like a dish category and we have 2+ parts
    if (name && /主食|蛋白|蔬菜|汤品|汤底|水果|调味|加餐|饮品|油脂|干料|谷物|配料|坚果/.test(category)) {
      return {
        category,
        name,
        display: `${category}｜${name}`,
        calories: Number.isFinite(calories) ? calories : null,
        raw: text,
        isDish: true,
      };
    }
  }

  const calMatch = text.match(CAL_ONLY_RE);
  return {
    category: '',
    name: text,
    display: text,
    calories: calMatch ? Number(calMatch[1]) : null,
    raw: text,
    isDish: false,
  };
}

export function parseDishLines(ingredients) {
  return String(ingredients || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDishLine)
    .filter(Boolean);
}

export function sumDishCalories(dishes) {
  return dishes.reduce((sum, dish) => sum + (dish.calories || 0), 0);
}

export function resolveMealCalories(recipe) {
  if (recipe?.calories != null && recipe.calories !== '') {
    return Number(recipe.calories);
  }
  return sumDishCalories(parseDishLines(recipe?.ingredients));
}
