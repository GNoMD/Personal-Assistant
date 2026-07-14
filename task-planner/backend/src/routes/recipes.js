import { Router } from 'express';
import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { seedSharedRecipeLibrary } from '../seed/seedRecipes.js';

const router = Router();
router.use(requireAuth);

function rowToRecipe(row) {
  return {
    id: row.id,
    title: row.title,
    mealType: row.meal_type,
    ingredients: row.ingredients,
    steps: row.steps,
    notes: row.notes,
    prepMinutes: row.prep_minutes,
    calories: row.calories,
    tags: row.tags,
    isFavorite: Boolean(row.is_favorite),
    source: row.source,
    templateKey: row.template_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shared: Boolean(row.shared),
  };
}

function getLibraryUserId() {
  return ensureRecipeLibraryUser(getDb());
}

function getReadableRecipe(id, userId) {
  const libraryUserId = getLibraryUserId();
  return getDb().prepare(`
    SELECT r.*,
      CASE
        WHEN r.user_id = @libraryUserId THEN 1
        ELSE 0
      END AS shared,
      CASE
        WHEN r.user_id = @userId THEN r.is_favorite
        WHEN f.user_id IS NOT NULL THEN 1
        ELSE 0
      END AS is_favorite
    FROM recipes r
    LEFT JOIN recipe_favorites f
      ON f.recipe_id = r.id AND f.user_id = @userId
    WHERE r.id = @id
      AND (r.user_id = @libraryUserId OR r.user_id = @userId)
  `).get({ id: Number(id), userId, libraryUserId });
}

function validate(body) {
  if (!body.title?.trim()) return '食谱名称必填';
  if (!body.ingredients?.trim()) return '至少填写一种食材';
  if (!body.steps?.trim()) return '请填写制作步骤';
  return null;
}

router.get('/', (req, res) => {
  const libraryUserId = seedSharedRecipeLibrary();
  const { mealType, q, favorite, source } = req.query;
  const clauses = ['(r.user_id = @libraryUserId OR (r.user_id = @userId AND r.source = \'custom\'))'];
  const params = { userId: req.user.id, libraryUserId };

  if (source === 'other') {
    clauses.push("r.source = 'other'");
  } else {
    clauses.push("r.source != 'other'");
  }

  if (mealType && mealType !== '全部') {
    clauses.push('r.meal_type = @mealType');
    params.mealType = mealType;
  }
  if (q?.trim()) {
    clauses.push('(r.title LIKE @q OR r.ingredients LIKE @q OR r.tags LIKE @q)');
    params.q = `%${q.trim()}%`;
  }
  if (favorite === 'true') {
    clauses.push(`(
      (r.user_id = @userId AND r.is_favorite = 1)
      OR (r.user_id = @libraryUserId AND f.user_id IS NOT NULL)
    )`);
  }

  const orderBy = source === 'other'
    ? `CASE
         WHEN r.template_key GLOB 'soy-rotation-d[0-9]' THEN CAST(substr(r.template_key, 15) AS INTEGER)
         ELSE 999
       END ASC, r.id ASC`
    : `CASE
         WHEN r.user_id = @userId THEN r.is_favorite
         WHEN f.user_id IS NOT NULL THEN 1
         ELSE 0
       END DESC, r.updated_at DESC, r.id DESC`;

  const rows = getDb().prepare(`
    SELECT
      r.*,
      CASE WHEN r.user_id = @libraryUserId THEN 1 ELSE 0 END AS shared,
      CASE
        WHEN r.user_id = @userId THEN r.is_favorite
        WHEN f.user_id IS NOT NULL THEN 1
        ELSE 0
      END AS is_favorite
    FROM recipes r
    LEFT JOIN recipe_favorites f
      ON f.recipe_id = r.id AND f.user_id = @userId
    WHERE ${clauses.join(' AND ')}
    ORDER BY ${orderBy}
  `).all(params);
  res.json({ recipes: rows.map(rowToRecipe) });
});

router.get('/:id', (req, res) => {
  seedSharedRecipeLibrary();
  const row = getReadableRecipe(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: '食谱不存在或无权查看' });
  res.json(rowToRecipe(row));
});

router.post('/', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const {
    title, mealType = '早餐', ingredients, steps, notes = '',
    prepMinutes = null, calories = null, tags = '', isFavorite = false,
  } = req.body;
  const result = getDb().prepare(`
    INSERT INTO recipes (
      user_id, title, meal_type, ingredients, steps, notes,
      prep_minutes, calories, tags, is_favorite, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'custom')
  `).run(
    req.user.id, title.trim(), mealType, ingredients.trim(), steps.trim(), notes.trim(),
    prepMinutes || null, calories || null, tags.trim(), isFavorite ? 1 : 0
  );
  res.status(201).json(rowToRecipe(getReadableRecipe(result.lastInsertRowid, req.user.id)));
});

router.patch('/:id', (req, res) => {
  seedSharedRecipeLibrary();
  const existing = getReadableRecipe(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '食谱不存在或无权修改' });

  const libraryUserId = getLibraryUserId();
  const isShared = existing.user_id === libraryUserId;
  const onlyFavorite = Object.keys(req.body).every((key) => key === 'isFavorite');

  if (isShared && !onlyFavorite) {
    return res.status(403).json({ error: '公共食谱库内容不可修改，仅可收藏' });
  }

  if (isShared && onlyFavorite) {
    const db = getDb();
    if (req.body.isFavorite) {
      db.prepare(`
        INSERT OR IGNORE INTO recipe_favorites (user_id, recipe_id) VALUES (?, ?)
      `).run(req.user.id, existing.id);
    } else {
      db.prepare(`
        DELETE FROM recipe_favorites WHERE user_id = ? AND recipe_id = ?
      `).run(req.user.id, existing.id);
    }
    return res.json(rowToRecipe(getReadableRecipe(existing.id, req.user.id)));
  }

  const next = {
    title: req.body.title ?? existing.title,
    mealType: req.body.mealType ?? existing.meal_type,
    ingredients: req.body.ingredients ?? existing.ingredients,
    steps: req.body.steps ?? existing.steps,
    notes: req.body.notes ?? existing.notes,
    prepMinutes: req.body.prepMinutes ?? existing.prep_minutes,
    calories: req.body.calories ?? existing.calories,
    tags: req.body.tags ?? existing.tags,
    isFavorite: req.body.isFavorite ?? Boolean(existing.is_favorite),
  };
  const error = validate(next);
  if (error) return res.status(400).json({ error });

  getDb().prepare(`
    UPDATE recipes SET
      title = @title, meal_type = @mealType, ingredients = @ingredients,
      steps = @steps, notes = @notes, prep_minutes = @prepMinutes,
      calories = @calories, tags = @tags, is_favorite = @isFavorite,
      updated_at = datetime('now')
    WHERE id = @id AND user_id = @userId
  `).run({
    ...next,
    title: next.title.trim(),
    ingredients: next.ingredients.trim(),
    steps: next.steps.trim(),
    notes: next.notes.trim(),
    tags: next.tags.trim(),
    prepMinutes: next.prepMinutes || null,
    calories: next.calories || null,
    isFavorite: next.isFavorite ? 1 : 0,
    id: Number(req.params.id),
    userId: req.user.id,
  });
  res.json(rowToRecipe(getReadableRecipe(req.params.id, req.user.id)));
});

router.delete('/:id', (req, res) => {
  const existing = getReadableRecipe(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '食谱不存在或无权删除' });
  if (existing.user_id === getLibraryUserId()) {
    return res.status(403).json({ error: '公共食谱库内容不可删除' });
  }
  const db = getDb();
  db.prepare('DELETE FROM recipe_favorites WHERE recipe_id = ?').run(existing.id);
  db.prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?').run(existing.id, req.user.id);
  res.json({ deleted: true, id: Number(req.params.id) });
});

export default router;
