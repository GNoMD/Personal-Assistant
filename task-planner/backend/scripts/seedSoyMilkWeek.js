#!/usr/bin/env node
/**
 * 写入「全新一周7天豆浆配方」相关数据（幂等，可重复执行）。
 *
 * 需要写入的内容：
 * 1. 系统食谱 7 条（template_key: soy-week-d1 … soy-week-d7，系列「豆浆轮换」）
 * 2. 目标用户私有菜单 1 份 + menu_items 7 条（默认账号 gnomd）
 *
 * 说明：
 * - 会走 getDb()，自动确保 menus / menu_items 表存在
 * - 仅 upsert 豆浆周数据，不重建其他用户任务
 * - 后端正常启动时也会自动 ensure；本脚本用于发版后显式补数 / 离线包部署
 *
 * 用法：
 *   cd task-planner/backend
 *
 *   # 0) 建议先备份
 *   cp "${DB_PATH:-../data/tasks.db}" "${DB_PATH:-../data/tasks.db}.bak.$(date +%Y%m%d%H%M%S)"
 *
 *   # 1) 预览（默认，不写库）
 *   DB_PATH=/path/to/tasks.db node scripts/seedSoyMilkWeek.js
 *
 *   # 2) 确认写入
 *   DB_PATH=/path/to/tasks.db node scripts/seedSoyMilkWeek.js --yes
 *
 *   # 3) 指定菜单归属用户（默认 gnomd）
 *   node scripts/seedSoyMilkWeek.js --user=gnomd --yes
 *
 * npm：
 *   npm run seed:soy-week
 *   npm run seed:soy-week -- --yes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SOY_WEEK_MENU_TITLE,
  SOY_WEEK_TEMPLATE_KEYS,
} from '../src/seed/soyMilkWeekRecipes.js';
import { DEFAULT_ADMIN_USERNAME } from '../src/seed/ensureDefaultAdmin.js';
import { ensureSoyMilkWeekData } from '../src/seed/ensureSoyMilkWeekMenu.js';
import { getDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    yes: false,
    help: false,
    user: DEFAULT_ADMIN_USERNAME,
    dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--user=')) args.user = a.slice('--user='.length).trim() || DEFAULT_ADMIN_USERNAME;
    else if (a === '--user' && argv[i + 1]) args.user = String(argv[++i]).trim() || DEFAULT_ADMIN_USERNAME;
    else if (a.startsWith('--db=')) args.dbPath = a.slice('--db='.length);
    else if (a === '--db' && argv[i + 1]) args.dbPath = argv[++i];
  }
  return args;
}

function printHelp() {
  console.log(`
用法: node scripts/seedSoyMilkWeek.js [--yes] [--user=gnomd] [--db=PATH]

  --yes / -y    真正写库（缺省仅为预览）
  --user=NAME   菜单归属用户（默认 ${DEFAULT_ADMIN_USERNAME}）
  --db=PATH     SQLite 路径（也可用环境变量 DB_PATH）

写入内容：
  - 系统食谱：${SOY_WEEK_TEMPLATE_KEYS.join(', ')}
  - 菜单标题：${SOY_WEEK_MENU_TITLE}
`.trim());
}

function inspect(db, username) {
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  const soyRecipes = db
    .prepare(
      `SELECT id, template_key AS templateKey, title
       FROM recipes
       WHERE source = 'system' AND template_key LIKE 'soy-week-d%'
       ORDER BY template_key`
    )
    .all();
  const menu = user
    ? db
      .prepare('SELECT id, title, updated_at AS updatedAt FROM menus WHERE user_id = ? AND title = ?')
      .get(user.id, SOY_WEEK_MENU_TITLE)
    : null;
  const itemCount = menu
    ? db.prepare('SELECT COUNT(*) AS c FROM menu_items WHERE menu_id = ?').get(menu.id).c
    : 0;

  return { user, soyRecipes, menu, itemCount };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  process.env.DB_PATH = path.resolve(args.dbPath);
  if (!fs.existsSync(process.env.DB_PATH)) {
    console.error(`[seed:soy-week] 数据库不存在: ${process.env.DB_PATH}`);
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  const before = inspect(db, args.user);

  console.log(`[seed:soy-week] DB=${process.env.DB_PATH}`);
  console.log(`[seed:soy-week] 菜单用户=${args.user}`);
  console.log(`[seed:soy-week] 写库前：豆浆系统食谱 ${before.soyRecipes.length}/${SOY_WEEK_TEMPLATE_KEYS.length} 条`);
  if (before.menu) {
    console.log(`[seed:soy-week] 写库前：菜单 #${before.menu.id}（items=${before.itemCount}）`);
  } else {
    console.log('[seed:soy-week] 写库前：目标菜单不存在');
  }
  if (!before.user) {
    console.warn(`[seed:soy-week] 警告：用户「${args.user}」不存在；写库后仍可插入系统食谱，但菜单会失败`);
  }

  if (!args.yes) {
    console.log('\n预览模式：未写库。确认后请加 --yes');
    console.log('将执行：');
    console.log(`  1) upsert ${SOY_WEEK_TEMPLATE_KEYS.length} 条系统食谱（豆浆轮换）`);
    console.log(`  2) 为 ${args.user} upsert 菜单「${SOY_WEEK_MENU_TITLE}」并挂满 7 道菜`);
    return;
  }

  const result = ensureSoyMilkWeekData(args.user);
  const after = inspect(db, args.user);

  console.log('\n[seed:soy-week] 已写库');
  console.log(`  食谱：新增 ${result.recipes.inserted}，更新 ${result.recipes.updated}`);
  if (!result.menu.ok) {
    console.error(`  菜单失败：${result.menu.reason}`);
    process.exitCode = 1;
    return;
  }
  console.log(`  菜单：#${result.menu.menuId}（${result.menu.menuAction}），组成 ${result.menu.recipeCount} 道`);
  console.log(`  校验：豆浆系统食谱 ${after.soyRecipes.length}/${SOY_WEEK_TEMPLATE_KEYS.length}，menu_items=${after.itemCount}`);
  after.soyRecipes.forEach((r) => {
    console.log(`    - ${r.templateKey} #${r.id} ${r.title}`);
  });
}

main();
