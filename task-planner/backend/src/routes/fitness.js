import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const ITEM_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

function listFavoriteIds(userId) {
  return getDb()
    .prepare(
      `SELECT item_id AS itemId FROM fitness_favorites
       WHERE user_id = ?
       ORDER BY created_at DESC, item_id ASC`
    )
    .all(userId)
    .map((row) => row.itemId);
}

/** GET /api/fitness/favorites → { itemIds: string[] } */
router.get('/favorites', (req, res) => {
  res.json({ itemIds: listFavoriteIds(req.user.id) });
});

/** PUT /api/fitness/favorites/:itemId  body: { isFavorite: boolean } */
router.put('/favorites/:itemId', (req, res) => {
  const itemId = String(req.params.itemId || '').trim();
  if (!ITEM_ID_RE.test(itemId)) {
    return res.status(400).json({ error: '无效的条目 ID' });
  }

  const isFavorite = Boolean(req.body?.isFavorite);
  const db = getDb();
  const userId = req.user.id;

  if (isFavorite) {
    db.prepare(
      `INSERT OR IGNORE INTO fitness_favorites (user_id, item_id) VALUES (?, ?)`
    ).run(userId, itemId);
  } else {
    db.prepare(
      `DELETE FROM fitness_favorites WHERE user_id = ? AND item_id = ?`
    ).run(userId, itemId);
  }

  res.json({ itemId, isFavorite, itemIds: listFavoriteIds(userId) });
});

export default router;
