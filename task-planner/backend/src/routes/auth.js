import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { hashPassword, comparePassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { requireAuth, toPublicUser } from '../middleware/auth.js';
import { seedUserTasks } from '../seed/seed.js';
import { ensureAssistantPersonality } from '../services/assistantPersonality.js';

const router = Router();

function loadPublicUser(userId) {
  const row = getDb().prepare(
    'SELECT id, username, display_name, role, assistant_personality FROM users WHERE id = ?'
  ).get(userId);
  return row ? toPublicUser(row) : null;
}
function makeInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, teamName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码必填' });
    }
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: '用户名至少3位，密码至少6位' });
    }

    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) return res.status(409).json({ error: '用户名已存在' });

    const passwordHash = await hashPassword(password);
    const name = displayName || username;

    const createUser = db.transaction(() => {
      const r = db.prepare(
        'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
      ).run(username, passwordHash, name);
      const userId = r.lastInsertRowid;

      let team = null;
      if (teamName) {
        const code = makeInviteCode();
        const tr = db.prepare(
          'INSERT INTO teams (name, invite_code, owner_id) VALUES (?, ?, ?)'
        ).run(teamName, code, userId);
        db.prepare(
          'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
        ).run(tr.lastInsertRowid, userId, 'owner');
        team = { id: tr.lastInsertRowid, name: teamName, inviteCode: code };
      }

      seedUserTasks(userId);
      return { userId, team };
    });

    const { userId, team } = createUser();
    ensureAssistantPersonality(userId);
    const token = signToken({ id: userId, username, role: 'user' });

    res.status(201).json({
      token,
      user: loadPublicUser(userId),
      team,
    });
  } catch (err) {
    console.error('[register]', err);
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: '注册失败，请稍后重试或联系管理员' });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }

  const row = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: '用户名或密码错误' });
  if (row.username === '__recipe_library__') {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const ok = await comparePassword(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: '用户名或密码错误' });

  ensureAssistantPersonality(row.id);

  const teams = getDb().prepare(`
    SELECT t.id, t.name, t.invite_code as inviteCode, tm.role
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `).all(row.id);

  const token = signToken(row);
  res.json({
    token,
    user: loadPublicUser(row.id),
    teams,
  });
});

/** GET /api/auth/me */
router.get('/me', requireAuth, (req, res) => {
  ensureAssistantPersonality(req.user.id);
  const teams = getDb().prepare(`
    SELECT t.id, t.name, t.invite_code as inviteCode, tm.role
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `).all(req.user.id);

  res.json({
    user: loadPublicUser(req.user.id),
    teams,
  });
});

/** PATCH /api/auth/password — change own password */
router.patch('/password', requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码都必填' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少6位' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: '新密码不能与当前密码相同' });
    }

    const row = getDb().prepare(
      'SELECT id, password_hash FROM users WHERE id = ?'
    ).get(req.user.id);
    if (!row) return res.status(404).json({ error: '用户不存在' });

    const ok = await comparePassword(currentPassword, row.password_hash);
    if (!ok) return res.status(400).json({ error: '当前密码不正确' });

    const passwordHash = await hashPassword(newPassword);
    getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id);
    res.json({ updated: true });
  } catch (err) {
    console.error('[change-password]', err);
    res.status(500).json({ error: '修改密码失败，请稍后重试' });
  }
});

export default router;
