/**
 * 健康计划午餐 / 晚餐：绑定日常均衡 lunch-dN / dinner-dN。
 */
import { DINNER_RECIPES, LUNCH_RECIPES } from './mealRecipes.js';

function byDayKey(recipes, prefix, planDay) {
  const key = `${prefix}${Number(planDay)}`;
  return recipes.find((r) => r.templateKey === key) || null;
}

export function getPlanLunchRecipe(planDay) {
  return byDayKey(LUNCH_RECIPES, 'lunch-d', planDay);
}

export function getPlanDinnerRecipe(planDay) {
  return byDayKey(DINNER_RECIPES, 'dinner-d', planDay);
}

function buildMealTaskContent(recipe, { mealLabel, category, sourceLine }) {
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
  parts.push(sourceLine);
  if (calories != null && calories !== '') parts.push(`约 ${calories} 千卡`);
  parts.push(`餐次：${mealLabel}`);
  if (ingredients.length) {
    parts.push(`食材：\n${ingredients.map((line) => `· ${line}`).join('\n')}`);
  }
  if (steps.length) {
    parts.push(`步骤：\n${steps.map((line, i) => `${i + 1}. ${line}`).join('\n')}`);
  }
  if (notes) parts.push(`说明：${notes}`);

  return {
    title: recipe.title,
    description: parts.join('\n\n'),
    category,
    templateKey,
    durationLabel: prepMinutes ? `约 ${prepMinutes} 分钟` : '约 30 分钟',
    durationMinutes: prepMinutes != null && prepMinutes !== '' ? Number(prepMinutes) : 30,
  };
}

export function buildLunchTaskContent(recipe) {
  return buildMealTaskContent(recipe, {
    mealLabel: '午餐',
    category: '午餐',
    sourceLine: '来源：食谱库 · 健康计划午餐',
  });
}

export function buildDinnerTaskContent(recipe) {
  return buildMealTaskContent(recipe, {
    mealLabel: '晚餐',
    category: '晚餐',
    sourceLine: '来源：食谱库 · 健康计划晚餐',
  });
}

export function planLunchTaskFields(planDay) {
  const recipe = getPlanLunchRecipe(planDay);
  if (!recipe) {
    throw new Error(`未找到计划第 ${planDay} 天对应的午餐食谱（lunch-d${planDay}）`);
  }
  return buildLunchTaskContent(recipe);
}

export function planDinnerTaskFields(planDay) {
  const recipe = getPlanDinnerRecipe(planDay);
  if (!recipe) {
    throw new Error(`未找到计划第 ${planDay} 天对应的晚餐食谱（dinner-d${planDay}）`);
  }
  return buildDinnerTaskContent(recipe);
}
