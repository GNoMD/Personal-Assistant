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
  const summed = sumDishCalories(parseDishLines(recipe?.ingredients));
  return summed > 0 ? summed : null;
}

/** 列表卡片展示用：有值则「约 N 千卡」，否则空串 */
export function getRecipeCaloriesLabel(recipe) {
  const n = resolveMealCalories(recipe);
  if (n == null || !Number.isFinite(n)) return '';
  return `约 ${Math.round(n)} 千卡`;
}

const FOOD_TASK_CATEGORIES = new Set(['早餐', '午餐', '晚餐', '下午茶', '夜宵', '食谱']);

/**
 * 从任务说明里提取展示用热量标签（日程卡片用）。
 * 优先取「约 N 千卡」独立行，避开食材明细里的分菜千卡。
 */
export function getTaskCaloriesLabel(task) {
  if (!FOOD_TASK_CATEGORIES.has(String(task?.category || ''))) return '';

  const text = String(task?.description || '');
  if (!text) return '';

  const header = text.split(/\n\s*食材[：:]/)[0] || text;
  const lines = header
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/[｜|]/.test(line)) continue;
    const range = line.match(/^约\s*(\d+\s*[～~\-－]\s*\d+)\s*千卡/);
    if (range) return `约 ${range[1].replace(/\s+/g, '')} 千卡`;
    const single = line.match(/^约\s*(\d+)\s*千卡/);
    if (single) return `约 ${single[1]} 千卡`;
    const ref = line.match(/参考热量约\s*(\d+)\s*千卡/);
    if (ref) return `约 ${ref[1]} 千卡`;
    const total = line.match(/合计约\s*(\d+)\s*千卡/);
    if (total) return `约 ${total[1]} 千卡`;
  }

  const fallback = header.match(/约\s*(\d+)\s*千卡/);
  return fallback ? `约 ${fallback[1]} 千卡` : '';
}

