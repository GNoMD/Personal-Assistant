import { Router } from 'express';
import { getDb, LIBRARY_USERNAME } from '../db.js';
import { requireAdmin, toPublicUser } from '../middleware/auth.js';
import { hashPassword } from '../auth/password.js';
import { seedUserTasks } from '../seed/seed.js';

const router = Router();

router.use(requireAdmin);

function mapUserRow(row) {
  return {
    ...toPublicUser(row),
    createdAt: row.createdAt ?? row.created_at,
    taskCount: row.taskCount ?? 0,
    recipeCount: row.recipeCount ?? 0,
  };
}

function getUserRow(id) {
  return getDb().prepare(`
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.role,
      u.created_at AS createdAt,
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id) AS taskCount,
      (SELECT COUNT(*) FROM recipes r WHERE r.user_id = u.id AND r.source = 'custom') AS recipeCount
    FROM users u
    WHERE u.id = ? AND u.username != ?
  `).get(id, LIBRARY_USERNAME);
}

function countAdmins() {
  return getDb().prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`).get().c;
}

/** GET /api/admin/overview */
router.get('/overview', (_req, res) => {
  const db = getDb();
  const users = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE username != ?`).get(LIBRARY_USERNAME).c;
  const admins = db.prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`).get().c;
  const tasks = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  const recipes = db.prepare('SELECT COUNT(*) AS c FROM recipes').get().c;
  const teams = db.prepare('SELECT COUNT(*) AS c FROM teams').get().c;
  res.json({ users, admins, tasks, recipes, teams });
});

/** GET /api/admin/users */
router.get('/users', (_req, res) => {
  const rows = getDb().prepare(`
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.role,
      u.created_at AS createdAt,
      (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id) AS taskCount,
      (SELECT COUNT(*) FROM recipes r WHERE r.user_id = u.id AND r.source = 'custom') AS recipeCount
    FROM users u
    WHERE u.username != ?
    ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.id ASC
  `).all(LIBRARY_USERNAME);

  res.json({ users: rows.map(mapUserRow) });
});

/** GET /api/admin/users/:id */
router.get('/users/:id', (req, res) => {
  const row = getUserRow(Number(req.params.id));
  if (!row) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: mapUserRow(row) });
});

/** POST /api/admin/users */
router.post('/users', async (req, res) => {
  try {
    const { username, password, displayName, role = 'user', seedTasks = true } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    if (String(username).length < 3 || String(password).length < 6) {
      return res.status(400).json({ error: '用户名至少3位，密码至少6位' });
    }
    if (username === LIBRARY_USERNAME) {
      return res.status(400).json({ error: '该用户名不可用' });
    }
    const nextRole = role === 'admin' ? 'admin' : 'user';
    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ error: '用户名已存在' });

    const passwordHash = await hashPassword(password);
    const name = (displayName || username).trim();

    const create = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO users (username, password_hash, display_name, role)
        VALUES (?, ?, ?, ?)
      `).run(username.trim(), passwordHash, name, nextRole);
      const userId = Number(result.lastInsertRowid);
      if (seedTasks) seedUserTasks(userId);
      return userId;
    });

    const userId = create();
    res.status(201).json({ user: mapUserRow(getUserRow(userId)) });
  } catch (err) {
    console.error('[admin create user]', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: '创建用户失败' });
  }
});

/** PATCH /api/admin/users/:id */
router.patch('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getDb().prepare(
      'SELECT id, username, display_name, role FROM users WHERE id = ? AND username != ?'
    ).get(id, LIBRARY_USERNAME);
    if (!existing) return res.status(404).json({ error: '用户不存在' });

    const { displayName, role, password } = req.body || {};
    let nextRole = existing.role;
    if (role !== undefined) {
      nextRole = role === 'admin' ? 'admin' : 'user';
      if (existing.role === 'admin' && nextRole !== 'admin' && countAdmins() <= 1) {
        return res.status(400).json({ error: '至少保留一名系统管理员' });
      }
      if (existing.id === req.user.id && nextRole !== 'admin') {
        return res.status(400).json({ error: '不能取消自己的管理员身份' });
      }
    }

    const nextName = displayName !== undefined
      ? String(displayName).trim() || existing.username
      : existing.display_name;

    if (password !== undefined && password !== '') {
      if (String(password).length < 6) {
        return res.status(400).json({ error: '密码至少6位' });
      }
      const passwordHash = await hashPassword(password);
      getDb().prepare(`
        UPDATE users SET display_name = ?, role = ?, password_hash = ? WHERE id = ?
      `).run(nextName, nextRole, passwordHash, id);
    } else {
      getDb().prepare(`
        UPDATE users SET display_name = ?, role = ? WHERE id = ?
      `).run(nextName, nextRole, id);
    }

    res.json({ user: mapUserRow(getUserRow(id)) });
  } catch (err) {
    console.error('[admin update user]', err);
    res.status(500).json({ error: '更新用户失败' });
  }
});

/** DELETE /api/admin/users/:id */
router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = getDb().prepare(
    'SELECT id, username, role FROM users WHERE id = ? AND username != ?'
  ).get(id, LIBRARY_USERNAME);
  if (!existing) return res.status(404).json({ error: '用户不存在' });
  if (existing.id === req.user.id) {
    return res.status(400).json({ error: '不能删除当前登录账号' });
  }
  if (existing.role === 'admin' && countAdmins() <= 1) {
    return res.status(400).json({ error: '至少保留一名系统管理员' });
  }

  const db = getDb();
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM recipe_favorites WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM recipes WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM task_audit_log WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM tasks WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM team_members WHERE user_id = ?').run(id);
    // Teams owned by this user: remove memberships then teams
    const owned = db.prepare('SELECT id FROM teams WHERE owner_id = ?').all(id);
    for (const team of owned) {
      db.prepare('DELETE FROM team_members WHERE team_id = ?').run(team.id);
      db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
  remove();

  res.json({ deleted: true, id });
});

export default router;
