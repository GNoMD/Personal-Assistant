import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';

export const DEFAULT_ADMIN_USERNAME = 'gnomd';

/** 仅用于首次创建账号；勿写入 .env.example / README。可用本地私密 .env 的 DEFAULT_ADMIN_PASSWORD 覆盖。 */
const BUILTIN_ADMIN_BOOTSTRAP_PASSWORD = '4a4b4c4d';

export function getDefaultAdminPassword() {
  return process.env.DEFAULT_ADMIN_PASSWORD || BUILTIN_ADMIN_BOOTSTRAP_PASSWORD;
}

/**
 * 确保默认管理员 gnomd 存在。
 * - 不存在：创建并设置引导密码，role=admin
 * - 已存在：只保证 admin 角色，不覆盖已有密码
 * @returns {{ userId: number, created: boolean }}
 */
export function ensureDefaultAdminUser() {
  const db = getDb();
  const username = DEFAULT_ADMIN_USERNAME;
  const existing = db.prepare('SELECT id, role FROM users WHERE username = ?').get(username);

  if (!existing) {
    const passwordHash = bcrypt.hashSync(getDefaultAdminPassword(), 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, 'admin')
    `).run(username, passwordHash, username);
    return { userId: Number(result.lastInsertRowid), created: true };
  }

  if (existing.role !== 'admin') {
    db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existing.id);
  }
  return { userId: existing.id, created: false };
}
