import { verifyToken } from '../auth/jwt.js';
import { getDb } from '../db.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '未登录，请先通过总入口登录' });
  }
  try {
    const payload = verifyToken(token);
    const user = getDb().prepare(
      'SELECT id, username, display_name, role FROM users WHERE id = ?'
    ).get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: '用户不存在或已失效' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: '需要系统管理员权限' });
    }
    next();
  });
}

export function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role || 'user',
    isAdmin: (row.role || 'user') === 'admin',
  };
}
