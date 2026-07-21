import { ensureSoyMilkBreakfastData } from '../src/seed/ensureSoyMilkBreakfastMenu.js';
import { ensurePlanLunchDinner } from '../src/seed/ensurePlanLunchDinner.js';
import { getDb } from '../src/db.js';
import { SOY_BREAKFAST_RECIPES } from '../src/seed/soyMilkBreakfastRecipes.js';
import { LUNCH_RECIPES, DINNER_RECIPES } from '../src/seed/mealRecipes.js';

const breakfastSync = ensureSoyMilkBreakfastData('gnomd');
const lunchDinner = ensurePlanLunchDinner();
console.log('breakfastSynced', breakfastSync.breakfastSynced, 'recipesUpdated', breakfastSync.recipes?.updated);
console.log('lunchDinner', lunchDinner);

const db = getDb();
const uid = db.prepare(`SELECT id FROM users WHERE username = 'gnomd'`).get()?.id;

const sample = db.prepare(`
  SELECT category, title, substr(description, 1, 100) AS d
  FROM tasks
  WHERE user_id = ? AND category IN ('早餐','午餐','晚餐')
  ORDER BY date DESC, category
  LIMIT 9
`).all(uid);

console.log('\n=== task samples ===');
for (const row of sample) console.log(row.category, row.title);

console.log('\n=== seed check ===');
console.log('soy eggs=2', SOY_BREAKFAST_RECIPES.every((r) => /水煮蛋 2/.test(r.ingredients)));
console.log('soy kcal', SOY_BREAKFAST_RECIPES.map((r) => r.calories).join(','));
console.log(
  'lunch',
  LUNCH_RECIPES.filter((r) => /^lunch-d[1-7]$/.test(r.templateKey))
    .map((r) => `${r.templateKey}:${r.calories}`)
    .join(' | ')
);
console.log(
  'dinner titles',
  DINNER_RECIPES.filter((r) => /^dinner-d[1-7]$/.test(r.templateKey))
    .map((r) => r.title)
    .join(' | ')
);

const dinnerTasks = db.prepare(`
  SELECT DISTINCT title FROM tasks
  WHERE user_id = ? AND category = '晚餐' AND template_key LIKE 'dinner-d%'
`).all(uid);
console.log('dinner task titles', dinnerTasks.map((r) => r.title).join(' | '));
