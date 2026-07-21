import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { resolveRecipeSeries } from './recipeSeries.js';
import {
  SOY_BREAKFAST_MENU_TITLE,
  SOY_BREAKFAST_RECIPES,
  SOY_BREAKFAST_TEMPLATE_KEYS,
} from './soyMilkBreakfastRecipes.js';
import { DEFAULT_ADMIN_USERNAME } from './ensureDefaultAdmin.js';

/**
 * Upsert 一人份豆浆早餐 7 条系统食谱（template_key: soy-breakfast-d1 … d7）。
 */
export function ensureSoyMilkBreakfastRecipes() {
  const db = getDb();
  const libraryUserId = ensureRecipeLibraryUser(db);

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

  let inserted = 0;
  let updated = 0;

  const run = db.transaction(() => {
    for (const recipe of SOY_BREAKFAST_RECIPES) {
      const series = resolveRecipeSeries({ ...recipe, source: 'system' });
      const payload = {
        userId: libraryUserId,
        source: 'system',
        ...recipe,
        series,
      };
      if (exists.get(libraryUserId, recipe.templateKey)) {
        updateSystem.run(payload);
        updated += 1;
      } else {
        insert.run(payload);
        inserted += 1;
      }
    }
  });
  run();

  const recipes = SOY_BREAKFAST_TEMPLATE_KEYS.map((key) => {
    const row = db
      .prepare(
        `SELECT id, template_key AS templateKey, title
         FROM recipes WHERE template_key = ? AND source = 'system'`
      )
      .get(key);
    return row;
  });

  return { libraryUserId, inserted, updated, recipes };
}

/**
 * 为管理员账号创建/更新「一人份一周豆浆早餐」组合菜单。
 */
export function ensureSoyMilkBreakfastMenu(username = DEFAULT_ADMIN_USERNAME) {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return { ok: false, reason: 'user_missing' };

  const recipes = SOY_BREAKFAST_TEMPLATE_KEYS.map((key) =>
    db.prepare(
      `SELECT id, title FROM recipes WHERE template_key = ? AND source = 'system'`
    ).get(key)
  );
  if (recipes.some((r) => !r)) {
    return { ok: false, reason: 'recipes_missing' };
  }

  const recipeIds = recipes.map((r) => r.id);
  const notes = [
    '一人份早餐：干料约56g + 水约550ml → 可饮500–600ml；建议配鸡蛋同食，一次喝完。',
    '浸泡：豆类/杂粮及山药茯苓莲子百合芡实建议泡≥4h并倒掉泡水；保留豆渣、不加糖。',
    '红线：黑芝麻≤3g、核桃≤3g、花生仅周六≤3g；高嘌呤豆单日≤18g；精制杂粮单日≤8g。',
    '白扁豆仅周二/周四/周六；周日无杂豆缓冲。详情见各日食谱。',
  ].join('\n');

  const existing = db
    .prepare('SELECT id FROM menus WHERE user_id = ? AND title = ?')
    .get(user.id, SOY_BREAKFAST_MENU_TITLE);

  let menuId;
  let menuAction = 'created';
  if (existing) {
    menuId = existing.id;
    menuAction = 'updated';
    db.prepare(`
      UPDATE menus SET
        meal_type = '早餐',
        notes = ?,
        tags = '豆浆早餐,一人份,一周',
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(notes, menuId, user.id);
    db.prepare('DELETE FROM menu_items WHERE menu_id = ?').run(menuId);
  } else {
    const result = db.prepare(`
      INSERT INTO menus (user_id, title, meal_type, notes, tags, is_favorite)
      VALUES (?, ?, '早餐', ?, '豆浆早餐,一人份,一周', 1)
    `).run(user.id, SOY_BREAKFAST_MENU_TITLE, notes);
    menuId = result.lastInsertRowid;
  }

  const insertItem = db.prepare(`
    INSERT INTO menu_items (menu_id, recipe_id, sort_order) VALUES (?, ?, ?)
  `);
  recipeIds.forEach((recipeId, index) => {
    insertItem.run(menuId, recipeId, index);
  });

  return {
    ok: true,
    menuId,
    menuAction,
    menuTitle: SOY_BREAKFAST_MENU_TITLE,
    recipeCount: recipeIds.length,
    userId: user.id,
    username,
  };
}

/** 食谱 + 菜单一次到位（幂等）。 */
export function ensureSoyMilkBreakfastData(username = DEFAULT_ADMIN_USERNAME) {
  const recipes = ensureSoyMilkBreakfastRecipes();
  const menu = ensureSoyMilkBreakfastMenu(username);
  return { recipes, menu };
}
