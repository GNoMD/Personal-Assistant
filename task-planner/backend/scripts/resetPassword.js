#!/usr/bin/env node
/**
 * 按用户名重置登录密码（无法「解密」原密码）。
 *
 * 本项目使用 bcrypt 单向哈希存储 password_hash：
 * - 只能验证「某个明文是否匹配」
 * - 不能从哈希还原用户当初设置的明文
 * 忘记密码时正确做法是：管理员重置为新密码，再告知用户改回。
 *
 * 用法：
 *   cd task-planner/backend
 *
 *   # 预览（不写库）
 *   node scripts/resetPassword.js --user=sadsad --password=新密码至少6位
 *
 *   # 确认写入
 *   node scripts/resetPassword.js --user=sadsad --password=新密码至少6位 --yes
 *
 *   # 指定库路径
 *   DB_PATH=../data/tasks.db node scripts/resetPassword.js --user=sadsad --password=xxx --yes
 *
 * 也可用环境变量：RESET_USER / RESET_PASSWORD
 */

import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { hashPassword } from '../src/auth/password.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = path.join(__dirname, '../../data/tasks.db');

function parseArgs(argv) {
  const args = { user: '', password: '', yes: false, help: false };
  for (const raw of argv) {
    if (raw === '--yes' || raw === '-y') args.yes = true;
    else if (raw === '--help' || raw === '-h') args.help = true;
    else if (raw.startsWith('--user=')) args.user = raw.slice('--user='.length).trim();
    else if (raw.startsWith('--password=')) args.password = raw.slice('--password='.length);
  }
  if (!args.user && process.env.RESET_USER) args.user = process.env.RESET_USER.trim();
  if (!args.password && process.env.RESET_PASSWORD) args.password = process.env.RESET_PASSWORD;
  return args;
}

function usage() {
  console.log(`
按用户名重置密码（bcrypt 不可解密，只能重置）

  node scripts/resetPassword.js --user=<用户名> --password=<新密码> [--yes]

示例：
  node scripts/resetPassword.js --user=sadsad --password=pass1234
  node scripts/resetPassword.js --user=sadsad --password=pass1234 --yes
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  if (!args.user || !args.password) {
    console.error('错误：必须提供 --user 与 --password（至少 6 位）');
    usage();
    process.exit(1);
  }
  if (String(args.password).length < 6) {
    console.error('错误：新密码至少 6 位');
    process.exit(1);
  }

  const dbPath = process.env.DB_PATH || DEFAULT_DB;
  console.log('说明：库内 password_hash 为 bcrypt 单向哈希，无法还原为原密码。');
  console.log(`数据库：${dbPath}`);
  console.log(`目标用户：${args.user}`);
  console.log(`操作：${args.yes ? '写入新密码哈希' : '仅预览（加 --yes 才会改库）'}`);

  const db = new Database(dbPath);
  try {
    const row = db
      .prepare(
        `SELECT id, username, display_name, role, password_hash
         FROM users WHERE lower(username) = lower(?)`
      )
      .get(args.user);

    if (!row) {
      console.error(`未找到用户：${args.user}`);
      process.exit(1);
    }

    console.log(`已找到：id=${row.id} username=${row.username} display=${row.display_name} role=${row.role}`);
    console.log(`当前哈希前缀：${String(row.password_hash || '').slice(0, 24)}…（不可逆）`);

    if (!args.yes) {
      console.log('\n预览结束。确认重置请追加 --yes');
      return;
    }

    const passwordHash = await hashPassword(args.password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.id);
    console.log(`\n已重置：${row.username} 可使用你指定的新密码登录。`);
    console.log('建议用户登录后尽快再改一次密码。');
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
