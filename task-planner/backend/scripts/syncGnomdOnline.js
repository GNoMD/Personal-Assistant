#!/usr/bin/env node
/**
 * 仅更新线上账号 gnomd 的任务规划数据，绝不改动其他用户。
 *
 * 本脚本直连 SQLite，不会走 getDb() 的全局迁移（避免误改其他用户早餐等数据）。
 *
 * ── 在服务器上执行（建议先停写或低峰）──
 *
 *   cd /path/to/Personal-Assistant/task-planner/backend
 *
 *   # 0) 先备份
 *   cp "${DB_PATH:-../data/tasks.db}" "${DB_PATH:-../data/tasks.db}.bak.$(date +%Y%m%d%H%M%S)"
 *
 *   # 1) 预览（默认，不写库）
 *   DB_PATH=/var/lib/task-planner/tasks.db node scripts/syncGnomdOnline.js
 *
 *   # 2) 同步三次用药 + 起床/洗发/入睡文案（推荐，保留其他任务完成打卡）
 *   DB_PATH=... node scripts/syncGnomdOnline.js --mode=meds --yes
 *
 *   # 3) 按最新 7 日模板整表重建 gnomd 全部任务（会清空该账号完成状态）
 *   DB_PATH=... node scripts/syncGnomdOnline.js --mode=full --yes
 *
 * 安全约束：
 * - 目标用户名写死为 gnomd，不接受改写其他账号
 * - 所有变更 SQL 均带 user_id = gnomd.id
 * - 未加 --yes 只打印预览
 * - 写库后核对「其他用户任务总数」必须与写库前一致
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import {
  START_DATE,
  SEED_DAYS,
  getTasksForPlanDay,
  planDayForDate,
  MEDICATION_TITLES,
} from '../src/seed/planData.js';
import { ensureGnomdMedicationSchedule } from '../src/seed/ensureGnomdMedicationSchedule.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_USERNAME = 'gnomd';

function parseArgs(argv) {
  const args = {
    mode: 'meds',
    yes: false,
    help: false,
    dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/tasks.db'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--mode=')) args.mode = a.slice('--mode='.length);
    else if (a === '--mode' && argv[i + 1]) args.mode = argv[++i];
    else if (a.startsWith('--db=')) args.dbPath = a.slice('--db='.length);
    else if (a === '--db' && argv[i + 1]) args.dbPath = argv[++i];
  }
  return args;
}

function printHelp() {
  console.log(`
用法: node scripts/syncGnomdOnline.js [--mode=meds|full] [--yes] [--db=PATH]

  --mode=meds   只同步 gnomd 的用药三次 + 相关护理文案（默认）
  --mode=full   删除并按最新模板重建 gnomd 全部任务（完成状态清零）
  --yes / -y    真正写库（缺省仅为预览）
  --db=PATH     SQLite 路径（也可用环境变量 DB_PATH）

目标账号固定为「${TARGET_USERNAME}」，不会更新其他用户。
`.trim());
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const y2 = dt.getFullYear();
  const m2 = String(dt.getMonth() + 1).padStart(2, '0');
  const d2 = String(dt.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
}

function snapshotCounts(db, userId) {
  const total = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  const mine = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c;
  const others = db
    .prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id IS NOT NULL AND user_id != ?')
    .get(userId).c;
  const meds = db
    .prepare(`SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND category = '用药'`)
    .get(userId).c;
  const byTitle = db
    .prepare(
      `SELECT title, COUNT(*) AS c FROM tasks
       WHERE user_id = ? AND category = '用药'
       GROUP BY title ORDER BY title`
    )
    .all(userId);
  const sampleDate = db
    .prepare(`SELECT date FROM tasks WHERE user_id = ? ORDER BY date DESC LIMIT 1`)
    .get(userId)?.date;
  const sample = sampleDate
    ? db
      .prepare(
        `SELECT time, category, title FROM tasks
         WHERE user_id = ? AND date = ?
         ORDER BY CASE WHEN time = '' OR time IS NULL THEN 1 ELSE 0 END, time, sort_order`
      )
      .all(userId, sampleDate)
    : [];
  return { total, mine, others, meds, byTitle, sampleDate, sample };
}

function assertOthersUnchanged(before, after) {
  if (before.others !== after.others) {
    throw new Error(
      `安全校验失败：其他用户任务数变化 ${before.others} → ${after.others}。请立即从备份恢复！`
    );
  }
}

/** 仅向 gnomd 写入约 365 天模板任务（不经过 seedUserTasks / getDb） */
function reseedGnomdTasks(db, userId) {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c;
  if (existing > 0) {
    throw new Error(`拒绝重种：user_id=${userId} 仍有 ${existing} 条任务，请先仅删除该用户任务`);
  }

  const insert = db.prepare(`
    INSERT INTO tasks (
      user_id, date, plan_day, plan_name, time, category, title, description,
      duration_label, duration_minutes, template_key, completed, sort_order
    ) VALUES (
      @userId, @date, @planDay, @planName, @time, @category, @title, @description,
      @durationLabel, @durationMinutes, @templateKey, 0, @sortOrder
    )
  `);

  let total = 0;
  const run = db.transaction(() => {
    for (let i = 0; i < SEED_DAYS; i += 1) {
      const date = addDays(START_DATE, i);
      const planDay = planDayForDate(date);
      const templates = getTasksForPlanDay(planDay, { includeHairCare: true });
      for (const t of templates) {
        insert.run({
          userId,
          date,
          planDay: t.planDay,
          planName: t.planName,
          time: t.time,
          category: t.category,
          title: t.title,
          description: t.description,
          durationLabel: t.durationLabel || '',
          durationMinutes: t.durationMinutes ?? null,
          templateKey: t.templateKey || null,
          sortOrder: t.sortOrder,
        });
        total += 1;
      }
    }
  });
  run();
  return { seeded: true, total };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!['meds', 'full'].includes(args.mode)) {
    console.error(`不支持的 mode: ${args.mode}（仅 meds|full）`);
    process.exit(1);
  }

  const dbPath = path.resolve(args.dbPath);
  if (!fs.existsSync(dbPath)) {
    console.error('数据库不存在:', dbPath);
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  try {
    const user = db
      .prepare('SELECT id, username, role, display_name FROM users WHERE username = ?')
      .get(TARGET_USERNAME);

    if (!user) {
      console.error(`未找到用户 ${TARGET_USERNAME}，拒绝执行（不会创建账号）。`);
      process.exit(1);
    }
    if (user.username !== TARGET_USERNAME) {
      console.error('用户名校验失败');
      process.exit(1);
    }

    const otherUsers = db
      .prepare(
        `SELECT id, username FROM users
         WHERE username != ? AND username != '__recipe_library__'
         ORDER BY id`
      )
      .all(TARGET_USERNAME);

    const before = snapshotCounts(db, user.id);

    console.log('══════════════════════════════════════');
    console.log('目标库:', dbPath);
    console.log('目标用户:', user);
    console.log('模式:', args.mode, args.yes ? '【写库】' : '【预览 dry-run】');
    console.log(
      '其他业务用户数:',
      otherUsers.length,
      otherUsers.map((u) => u.username).join(', ') || '(无)'
    );
    console.log('── 写库前统计 ──');
    console.log({
      tasksTotal: before.total,
      gnomdTasks: before.mine,
      otherUsersTasks: before.others,
      gnomdMedTasks: before.meds,
      medByTitle: before.byTitle,
      sampleDate: before.sampleDate,
    });
    if (before.sample.length) {
      console.log(`样本日 ${before.sampleDate} 任务:`);
      console.table(before.sample);
    }
    console.log('将同步的用药标题:', MEDICATION_TITLES);

    if (!args.yes) {
      console.log('\n预览结束，未改动数据库。确认无误后追加 --yes 执行。');
      console.log('推荐先备份: cp "$DB_PATH" "$DB_PATH.bak.$(date +%Y%m%d%H%M%S)"');
      return;
    }

    let result;
    if (args.mode === 'meds') {
      result = ensureGnomdMedicationSchedule(user.id, { force: true, database: db });
    } else {
      const deleted = db.prepare('DELETE FROM tasks WHERE user_id = ?').run(user.id);
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id TEXT PRIMARY KEY,
          applied_at TEXT DEFAULT (datetime('now'))
        );
      `);
      db.prepare(`DELETE FROM schema_migrations WHERE id = ?`).run('gnomd_med_schedule_v2_am_noon_pm');
      const seeded = reseedGnomdTasks(db, user.id);
      // 模板已含用药；再跑一遍确保起床/洗发/入睡文案与迁移标记一致
      const med = ensureGnomdMedicationSchedule(user.id, { force: true, database: db });
      result = { deleted: deleted.changes, seeded, med };
    }

    const still = db.prepare('SELECT id FROM users WHERE username = ?').get(TARGET_USERNAME);
    if (!still || still.id !== user.id) {
      throw new Error('写库后用户身份校验失败');
    }

    const after = snapshotCounts(db, user.id);
    assertOthersUnchanged(before, after);

    console.log('── 写库结果 ──');
    console.log(result);
    console.log('── 写库后统计 ──');
    console.log({
      tasksTotal: after.total,
      gnomdTasks: after.mine,
      otherUsersTasks: after.others,
      gnomdMedTasks: after.meds,
      medByTitle: after.byTitle,
      sampleDate: after.sampleDate,
    });
    if (after.sample.length) {
      console.log(`样本日 ${after.sampleDate} 任务:`);
      console.table(after.sample);
    }
    console.log('✓ 其他用户任务数未变化:', after.others);
    console.log('══════════════════════════════════════');
  } finally {
    db.close();
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
