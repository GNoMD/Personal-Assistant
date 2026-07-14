import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { BREAKFAST_RECIPES } from './breakfastRecipes.js';
import { MEAL_RECIPES } from './mealRecipes.js';
import { SOY_MILK_RECIPES } from './soyMilkRecipes.js';

const DEFAULT_RECIPES = [...BREAKFAST_RECIPES, ...MEAL_RECIPES];
const OTHER_RECIPES = SOY_MILK_RECIPES;
const OLD_DEFAULT_TITLES = [
  '黑豆浆核桃全麦早餐',
  '豆浆燕麦香蕉早餐',
  '紫薯蓝莓能量早餐',
  '小米南瓜双豆早餐',
  '玉米糙米饭团早餐',
  '鸡蛋荞麦周末早餐',
  '五红豆浆杂粮早餐',
];

function seedTemplateRecipes(libraryUserId, recipes, source) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO recipes (
      user_id, title, meal_type, ingredients, steps, notes,
      prep_minutes, calories, tags, source, template_key
    ) VALUES (
      @userId, @title, @mealType, @ingredients, @steps, @notes,
      @prepMinutes, @calories, @tags, @source, @templateKey
    )
  `);
  const updateSystem = db.prepare(`
    UPDATE recipes SET
      title = @title,
      meal_type = @mealType,
      ingredients = @ingredients,
      steps = @steps,
      notes = @notes,
      prep_minutes = @prepMinutes,
      calories = @calories,
      tags = @tags,
      source = @source,
      updated_at = datetime('now')
    WHERE user_id = @userId AND template_key = @templateKey AND source IN ('system', 'other')
  `);
  const exists = db.prepare(
    'SELECT id FROM recipes WHERE user_id = ? AND template_key = ?'
  );

  for (const recipe of recipes) {
    const payload = { userId: libraryUserId, source, ...recipe };
    if (exists.get(libraryUserId, recipe.templateKey)) {
      updateSystem.run(payload);
    } else {
      insert.run(payload);
    }
  }
}

/** Shared library only — new users do not get private copies. Safe to call on every boot. */
export function seedSharedRecipeLibrary() {
  const db = getDb();
  const libraryUserId = ensureRecipeLibraryUser(db);
  db.transaction(() => {
    seedTemplateRecipes(libraryUserId, DEFAULT_RECIPES, 'system');
    seedTemplateRecipes(libraryUserId, OTHER_RECIPES, 'other');
    db.prepare(`
      DELETE FROM recipes
      WHERE user_id != ? AND source IN ('system', 'other')
    `).run(libraryUserId);
    db.prepare(`
      DELETE FROM recipes
      WHERE user_id = ? AND source = 'custom' AND title IN (${OLD_DEFAULT_TITLES.map(() => '?').join(', ')})
    `).run(libraryUserId, ...OLD_DEFAULT_TITLES);
  })();
  return libraryUserId;
}

export function getRecipeSeedStats() {
  return {
    system: DEFAULT_RECIPES.length,
    other: OTHER_RECIPES.length,
  };
}
