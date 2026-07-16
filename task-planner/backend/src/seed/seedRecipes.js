import { ensureRecipeLibraryUser, getDb, syncPlanBreakfastTasksFromRecipes } from '../db.js';
import { AGA_MUSCLE_RECIPES } from './agaMuscleRecipes.js';
import { AFTERNOON_TEA_RECIPES } from './afternoonTeaRecipes.js';
import { BREAKFAST_RECIPES } from './breakfastRecipes.js';
import { HAIR_CARE_RECIPES } from './hairCareRecipes.js';
import { MEAL_RECIPES } from './mealRecipes.js';
import { SOY_WEEK_RECIPES } from './soyMilkWeekRecipes.js';
import { resolveRecipeSeries } from './recipeSeries.js';
import { ensurePlanAfternoonTea } from './ensurePlanAfternoonTea.js';
import { ensurePlanLunchDinner } from './ensurePlanLunchDinner.js';
import { ensureSoyMilkWeekMenu } from './ensureSoyMilkWeekMenu.js';

const DEFAULT_RECIPES = [
  ...BREAKFAST_RECIPES,
  ...AFTERNOON_TEA_RECIPES,
  ...MEAL_RECIPES,
  ...AGA_MUSCLE_RECIPES,
  ...HAIR_CARE_RECIPES,
  ...SOY_WEEK_RECIPES,
];
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
      prep_minutes, calories, tags, source, template_key, series
    ) VALUES (
      @userId, @title, @mealType, @ingredients, @steps, @notes,
      @prepMinutes, @calories, @tags, @source, @templateKey, @series
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
      series = @series,
      updated_at = datetime('now')
    WHERE user_id = @userId AND template_key = @templateKey AND source = 'system'
  `);
  const exists = db.prepare(
    'SELECT id FROM recipes WHERE user_id = ? AND template_key = ?'
  );

  for (const recipe of recipes) {
    const series = resolveRecipeSeries({ ...recipe, source });
    const payload = {
      userId: libraryUserId,
      source,
      ...recipe,
      series,
    };
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
    // 移除已废弃的「其他食谱 / 豆浆轮换」数据
    db.prepare(`DELETE FROM recipes WHERE source = 'other'`).run();
    db.prepare(`
      DELETE FROM recipes
      WHERE user_id != ? AND source = 'system'
    `).run(libraryUserId);
    db.prepare(`
      DELETE FROM recipes
      WHERE user_id = ? AND source = 'custom' AND title IN (${OLD_DEFAULT_TITLES.map(() => '?').join(', ')})
    `).run(libraryUserId, ...OLD_DEFAULT_TITLES);
    // 回填旧定制食谱空系列
    db.prepare(`
      UPDATE recipes SET series = '我的定制'
      WHERE source = 'custom' AND (series IS NULL OR series = '')
    `).run();
  })();
  // 计划早餐 / 午晚餐 / 下午茶与食谱库对齐（需在系统食谱 upsert 之后）
  syncPlanBreakfastTasksFromRecipes(db);
  ensurePlanAfternoonTea({ database: db });
  ensurePlanLunchDinner({ database: db });
  ensureSoyMilkWeekMenu();
  return libraryUserId;
}

export function getRecipeSeedStats() {
  return {
    system: DEFAULT_RECIPES.length,
  };
}
