import { Router } from 'express';
import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { seedSharedRecipeLibrary } from '../seed/seedRecipes.js';

const router = Router();
router.use(requireAuth);

function getLibraryUserId() {
  return ensureRecipeLibraryUser(getDb());
}

function normalizeRecipeIds(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const ids = [];
  for (const item of raw) {
    const id = Number(item);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function isRecipeReadable(recipeId, userId) {
  const libraryUserId = getLibraryUserId();
  return Boolean(
    getDb()
      .prepare(
        `
      SELECT id FROM recipes
      WHERE id = ?
        AND (user_id = ? OR (user_id = ? AND source = 'custom'))
    `
      )
      .get(recipeId, libraryUserId, userId)
  );
}

function loadMenuItems(menuId, userId) {
  const libraryUserId = getLibraryUserId();
  return getDb()
    .prepare(
      `
    SELECT
      mi.recipe_id AS recipe_id,
      mi.sort_order AS sort_order,
      r.title AS title,
      r.meal_type AS meal_type,
      r.calories AS calories,
      r.prep_minutes AS prep_minutes,
      r.tags AS tags,
      r.source AS source,
      CASE WHEN r.user_id = ? THEN 1 ELSE 0 END AS shared
    FROM menu_items mi
    JOIN recipes r ON r.id = mi.recipe_id
    WHERE mi.menu_id = ?
      AND (r.user_id = ? OR r.user_id = ?)
    ORDER BY mi.sort_order ASC, mi.recipe_id ASC
  `
    )
    .all(libraryUserId, menuId, libraryUserId, userId)
    .map((row) => ({
      recipeId: row.recipe_id,
      sortOrder: row.sort_order,
      title: row.title,
      mealType: row.meal_type,
      calories: row.calories,
      prepMinutes: row.prep_minutes,
      tags: row.tags || '',
      source: row.source,
      shared: Boolean(row.shared),
    }));
}

function summarizeItems(items) {
  const recipeCount = items.length;
  let calories = 0;
  let hasCal = false;
  let prepMinutes = 0;
  let hasPrep = false;
  for (const item of items) {
    if (item.calories != null && item.calories !== '') {
      calories += Number(item.calories) || 0;
      hasCal = true;
    }
    if (item.prepMinutes != null && item.prepMinutes !== '') {
      prepMinutes += Number(item.prepMinutes) || 0;
      hasPrep = true;
    }
  }
  return {
    recipeCount,
    calories: hasCal ? calories : null,
    prepMinutes: hasPrep ? prepMinutes : null,
  };
}

function rowToMenu(row, items = []) {
  const summary = summarizeItems(items);
  return {
    id: row.id,
    title: row.title,
    mealType: row.meal_type,
    notes: row.notes || '',
    tags: row.tags || '',
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    ...summary,
  };
}

function getOwnedMenu(id, userId) {
  return getDb()
    .prepare('SELECT * FROM menus WHERE id = ? AND user_id = ?')
    .get(Number(id), userId);
}

function getMenuPayload(id, userId) {
  const row = getOwnedMenu(id, userId);
  if (!row) return null;
  const items = loadMenuItems(row.id, userId);
  return rowToMenu(row, items);
}

function replaceMenuItems(menuId, recipeIds) {
  const db = getDb();
  db.prepare('DELETE FROM menu_items WHERE menu_id = ?').run(menuId);
  const insert = db.prepare(`
    INSERT INTO menu_items (menu_id, recipe_id, sort_order) VALUES (?, ?, ?)
  `);
  recipeIds.forEach((recipeId, index) => {
    insert.run(menuId, recipeId, index);
  });
}

function validateMenuBody(body, { requireIds } = { requireIds: true }) {
  if (!body.title?.trim()) return '菜单名称必填';
  if (requireIds || body.recipeIds !== undefined) {
    const ids = normalizeRecipeIds(body.recipeIds);
    if (ids.length < 2) return '请至少选择 2 个食谱组成菜单';
  }
  return null;
}

router.get('/', (req, res) => {
  seedSharedRecipeLibrary();
  const { mealType, q, favorite } = req.query;
  const clauses = ['m.user_id = @userId'];
  const params = { userId: req.user.id };

  if (mealType && mealType !== '全部') {
    clauses.push('m.meal_type = @mealType');
    params.mealType = mealType;
  }
  if (q?.trim()) {
    clauses.push('(m.title LIKE @q OR m.notes LIKE @q OR m.tags LIKE @q)');
    params.q = `%${q.trim()}%`;
  }
  if (favorite === 'true') {
    clauses.push('m.is_favorite = 1');
  }

  const rows = getDb()
    .prepare(
      `
    SELECT m.*
    FROM menus m
    WHERE ${clauses.join(' AND ')}
    ORDER BY m.is_favorite DESC, m.updated_at DESC, m.id DESC
  `
    )
    .all(params);

  const menus = rows.map((row) => {
    const items = loadMenuItems(row.id, req.user.id);
    return rowToMenu(row, items);
  });
  res.json({ menus });
});

router.get('/:id', (req, res) => {
  seedSharedRecipeLibrary();
  const menu = getMenuPayload(req.params.id, req.user.id);
  if (!menu) return res.status(404).json({ error: '菜单不存在或无权查看' });
  res.json(menu);
});

router.post('/', (req, res) => {
  seedSharedRecipeLibrary();
  const error = validateMenuBody(req.body, { requireIds: true });
  if (error) return res.status(400).json({ error });

  const recipeIds = normalizeRecipeIds(req.body.recipeIds);
  for (const recipeId of recipeIds) {
    if (!isRecipeReadable(recipeId, req.user.id)) {
      return res.status(400).json({ error: `食谱 #${recipeId} 不存在或无权选用` });
    }
  }

  const {
    title,
    mealType = '午餐',
    notes = '',
    tags = '',
    isFavorite = false,
  } = req.body;

  const db = getDb();
  const result = db
    .prepare(
      `
    INSERT INTO menus (user_id, title, meal_type, notes, tags, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      req.user.id,
      title.trim(),
      mealType || '午餐',
      String(notes || '').trim(),
      String(tags || '').trim(),
      isFavorite ? 1 : 0
    );

  replaceMenuItems(result.lastInsertRowid, recipeIds);
  res.status(201).json(getMenuPayload(result.lastInsertRowid, req.user.id));
});

router.patch('/:id', (req, res) => {
  seedSharedRecipeLibrary();
  const existing = getOwnedMenu(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '菜单不存在或无权修改' });

  const nextBody = {
    title: req.body.title ?? existing.title,
    mealType: req.body.mealType ?? existing.meal_type,
    notes: req.body.notes ?? existing.notes,
    tags: req.body.tags ?? existing.tags,
    isFavorite: req.body.isFavorite ?? Boolean(existing.is_favorite),
    recipeIds: req.body.recipeIds,
  };

  const error = validateMenuBody(nextBody, {
    requireIds: req.body.recipeIds !== undefined,
  });
  if (error) return res.status(400).json({ error });

  let recipeIds = null;
  if (req.body.recipeIds !== undefined) {
    recipeIds = normalizeRecipeIds(req.body.recipeIds);
    for (const recipeId of recipeIds) {
      if (!isRecipeReadable(recipeId, req.user.id)) {
        return res.status(400).json({ error: `食谱 #${recipeId} 不存在或无权选用` });
      }
    }
  }

  getDb()
    .prepare(
      `
    UPDATE menus SET
      title = ?, meal_type = ?, notes = ?, tags = ?, is_favorite = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `
    )
    .run(
      String(nextBody.title).trim(),
      nextBody.mealType || '午餐',
      String(nextBody.notes || '').trim(),
      String(nextBody.tags || '').trim(),
      nextBody.isFavorite ? 1 : 0,
      existing.id,
      req.user.id
    );

  if (recipeIds) replaceMenuItems(existing.id, recipeIds);
  res.json(getMenuPayload(existing.id, req.user.id));
});

router.delete('/:id', (req, res) => {
  const existing = getOwnedMenu(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '菜单不存在或无权删除' });
  const db = getDb();
  db.prepare('DELETE FROM menu_items WHERE menu_id = ?').run(existing.id);
  db.prepare('DELETE FROM menus WHERE id = ? AND user_id = ?').run(existing.id, req.user.id);
  res.json({ deleted: true, id: existing.id });
});

export default router;
