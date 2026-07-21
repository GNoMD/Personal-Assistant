#!/usr/bin/env node
/**
 * 写入「一人份一周豆浆早餐」相关数据（幂等）。
 *
 *   npm run seed:soy-breakfast -- --yes
 *   node scripts/seedSoyMilkBreakfast.js --user=gnomd --yes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SOY_BREAKFAST_MENU_TITLE,
  SOY_BREAKFAST_TEMPLATE_KEYS,
} from '../src/seed/soyMilkBreakfastRecipes.js';
import { DEFAULT_ADMIN_USERNAME } from '../src/seed/ensureDefaultAdmin.js';
import { ensureSoyMilkBreakfastData } from '../src/seed/ensureSoyMilkBreakfastMenu.js';
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
用法: node scripts/seedSoyMilkBreakfast.js [--yes] [--user=gnomd] [--db=PATH]

  --yes / -y    真正写库（缺省仅为预览）
  --user=NAME   菜单归属用户（默认 ${DEFAULT_ADMIN_USERNAME}）
  --db=PATH     SQLite 路径（也可用环境变量 DB_PATH）

写入内容：
  - 系统食谱：${SOY_BREAKFAST_TEMPLATE_KEYS.join(', ')}
  - 菜单标题：${SOY_BREAKFAST_MENU_TITLE}
`.trim());
}

function inspect(db, username) {
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  const recipes = db
    .prepare(
      `SELECT id, template_key AS templateKey, title
       FROM recipes
       WHERE source = 'system' AND template_key LIKE 'soy-breakfast-d%'
       ORDER BY template_key`
    )
    .all();
  const menu = user
    ? db
      .prepare('SELECT id, title, updated_at AS updatedAt FROM menus WHERE user_id = ? AND title = ?')
      .get(user.id, SOY_BREAKFAST_MENU_TITLE)
    : null;
  const itemCount = menu
    ? db.prepare('SELECT COUNT(*) AS c FROM menu_items WHERE menu_id = ?').get(menu.id).c
    : 0;

  return { user, recipes, menu, itemCount };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  process.env.DB_PATH = path.resolve(args.dbPath);
  if (!fs.existsSync(process.env.DB_PATH)) {
    console.error(`[seed:soy-breakfast] 数据库不存在: ${process.env.DB_PATH}`);
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  const before = inspect(db, args.user);

  console.log(`[seed:soy-breakfast] DB=${process.env.DB_PATH}`);
  console.log(`[seed:soy-breakfast] 菜单用户=${args.user}`);
  console.log(`[seed:soy-breakfast] 写库前：系统食谱 ${before.recipes.length}/${SOY_BREAKFAST_TEMPLATE_KEYS.length} 条`);
  if (before.menu) {
    console.log(`[seed:soy-breakfast] 写库前：菜单 #${before.menu.id}（items=${before.itemCount}）`);
  } else {
    console.log('[seed:soy-breakfast] 写库前：目标菜单不存在');
  }

  if (!args.yes) {
    console.log('\n预览模式：未写库。确认后请加 --yes');
    console.log(`将 upsert ${SOY_BREAKFAST_TEMPLATE_KEYS.length} 条食谱 + 菜单「${SOY_BREAKFAST_MENU_TITLE}」`);
    return;
  }

  const result = ensureSoyMilkBreakfastData(args.user);
  const after = inspect(db, args.user);

  console.log('\n[seed:soy-breakfast] 已写库');
  console.log(`  食谱：新增 ${result.recipes.inserted}，更新 ${result.recipes.updated}`);
  if (!result.menu.ok) {
    console.error(`  菜单失败：${result.menu.reason}`);
    process.exitCode = 1;
    return;
  }
  console.log(`  菜单：#${result.menu.menuId}（${result.menu.menuAction}），组成 ${result.menu.recipeCount} 道`);
  console.log(`  校验：系统食谱 ${after.recipes.length}/${SOY_BREAKFAST_TEMPLATE_KEYS.length}，menu_items=${after.itemCount}`);
  after.recipes.forEach((r) => {
    console.log(`    - ${r.templateKey} #${r.id} ${r.title}`);
  });
}

main();
