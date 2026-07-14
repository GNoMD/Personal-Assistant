import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

function makeInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.use(requireAuth);

/** POST /api/teams — 创建团队 */
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: '团队名称必填' });

  const db = getDb();
  const code = makeInviteCode();
  const r = db.prepare(
    'INSERT INTO teams (name, invite_code, owner_id) VALUES (?, ?, ?)'
  ).run(name.trim(), code, req.user.id);
  db.prepare(
    'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
  ).run(r.lastInsertRowid, req.user.id, 'owner');

  res.status(201).json({
    id: r.lastInsertRowid,
    name: name.trim(),
    inviteCode: code,
    role: 'owner',
  });
});

/** POST /api/teams/join — 加入团队 */
router.post('/join', (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: '邀请码必填' });

  const db = getDb();
  const team = db.prepare('SELECT * FROM teams WHERE invite_code = ?').get(inviteCode.toUpperCase());
  if (!team) return res.status(404).json({ error: '邀请码无效' });

  const member = db.prepare(
    'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(team.id, req.user.id);
  if (member) return res.json({ id: team.id, name: team.name, inviteCode: team.invite_code, role: 'member' });

  db.prepare(
    'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)'
  ).run(team.id, req.user.id, 'member');

  res.json({ id: team.id, name: team.name, inviteCode: team.invite_code, role: 'member' });
});

/** GET /api/teams/:id/members */
router.get('/:id/members', (req, res) => {
  const teamId = Number(req.params.id);
  const db = getDb();
  const isMember = db.prepare(
    'SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, req.user.id);
  if (!isMember) return res.status(403).json({ error: '无权查看该团队' });

  const members = db.prepare(`
    SELECT u.id, u.username, u.display_name as displayName, tm.role, tm.joined_at as joinedAt
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
  `).all(teamId);

  res.json({ teamId, members });
});

export default router;
