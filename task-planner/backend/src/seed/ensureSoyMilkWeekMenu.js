import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { resolveRecipeSeries } from './recipeSeries.js';
import {
  SOY_WEEK_MENU_TITLE,
  SOY_WEEK_RECIPES,
  SOY_WEEK_TEMPLATE_KEYS,
} from './soyMilkWeekRecipes.js';
import { DEFAULT_ADMIN_USERNAME } from './ensureDefaultAdmin.js';

/**
 * Upsert 一周豆浆 7 条系统食谱（template_key: soy-week-d1 … d7）。
 * @returns {{ libraryUserId: number, inserted: number, updated: number, recipes: Array<{id:number,templateKey:string,title:string}> }}
 */
export function ensureSoyMilkWeekRecipes() {
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
    for (const recipe of SOY_WEEK_RECIPES) {
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

  const recipes = SOY_WEEK_TEMPLATE_KEYS.map((key) => {
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
 * 为管理员账号创建/更新「一周豆浆」组合菜单（依赖已种子的 soy-week-d* 食谱）。
 */
export function ensureSoyMilkWeekMenu(username = DEFAULT_ADMIN_USERNAME) {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) return { ok: false, reason: 'user_missing' };

  const recipes = SOY_WEEK_TEMPLATE_KEYS.map((key) =>
    db.prepare(
      `SELECT id, title FROM recipes WHERE template_key = ? AND source = 'system'`
    ).get(key)
  );
  if (recipes.some((r) => !r)) {
    return { ok: false, reason: 'recipes_missing' };
  }

  const recipeIds = recipes.map((r) => r.id);
  const notes = [
    '统一：1200ml水/4人份；总干料117–122g；杂粮浸泡4h倒掉泡水；保留豆渣、不加糖。',
    '红线：黑芝麻≤6g、核桃≤8g、花生仅周六≤10g；杂豆单日≤50g；红米黑米小米糙米单日合计≤15g。',
    '白扁豆仅周二/周四/周六；周日无豆缓冲。详情见各日食谱备注。',
  ].join('\n');

  const existing = db
    .prepare('SELECT id FROM menus WHERE user_id = ? AND title = ?')
    .get(user.id, SOY_WEEK_MENU_TITLE);

  let menuId;
  let menuAction = 'created';
  if (existing) {
    menuId = existing.id;
    menuAction = 'updated';
    db.prepare(`
      UPDATE menus SET
        meal_type = '饮品',
        notes = ?,
        tags = '豆浆轮换,一周,4人份',
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(notes, menuId, user.id);
    db.prepare('DELETE FROM menu_items WHERE menu_id = ?').run(menuId);
  } else {
    const result = db.prepare(`
      INSERT INTO menus (user_id, title, meal_type, notes, tags, is_favorite)
      VALUES (?, ?, '饮品', ?, '豆浆轮换,一周,4人份', 1)
    `).run(user.id, SOY_WEEK_MENU_TITLE, notes);
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
    menuTitle: SOY_WEEK_MENU_TITLE,
    recipeCount: recipeIds.length,
    userId: user.id,
    username,
  };
}

/** 食谱 + 菜单一次到位（幂等）。 */
export function ensureSoyMilkWeekData(username = DEFAULT_ADMIN_USERNAME) {
  const recipes = ensureSoyMilkWeekRecipes();
  const menu = ensureSoyMilkWeekMenu(username);
  return { recipes, menu };
}
