import { randomUUID } from 'crypto';
import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { planDayForDate, PLAN_META } from '../seed/planData.js';
import { inferDuration } from '../seed/durationMap.js';
import { logTaskAction } from './audit.js';
import { emitToUser } from '../socket.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const WRITE_TOOLS = new Set(['create_task', 'update_task', 'delete_task']);
const CROSS_USER_KEYS = new Set([
  'user_id', 'userId', 'username', 'user_name', 'owner', 'owner_id', 'ownerId',
  'target_user', 'targetUser', 'other_user', 'otherUser', 'account', 'account_id',
]);

export const ASSISTANT_TOOLS = [
  {
    type: 'function',
    name: 'list_tasks',
    description:
      '只读取当前登录用户某一天的任务数据。不能查询其他用户；不能修改页面或系统功能；不要传 user_id/username。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '日期，格式 YYYY-MM-DD' },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'search_recipes',
    description:
      '搜索食谱数据（共享库 + 本人私人食谱）。仅返回食谱内容建议，不能改页面或系统功能；不要传 user_id/username。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '标题、食材或标签关键词' },
        meal_type: { type: 'string', enum: ['早餐', '午餐', '晚餐', '加餐', '饮品'] },
        limit: { type: 'integer', minimum: 1, maximum: 10 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'create_task',
    description:
      '仅为当前登录用户写入一条任务数据。不能改功能页面。调用后必须由用户在界面确认才会执行。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        title: { type: 'string' },
        category: { type: 'string' },
        time: { type: 'string', description: 'HH:mm，可留空' },
        description: { type: 'string' },
      },
      required: ['date', 'title', 'category'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'update_task',
    description:
      '仅修改当前登录用户自己的任务数据（标题/时间/完成状态等）。不能改功能页面。调用后必须由用户确认。',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        time: { type: 'string' },
        completed: { type: 'boolean' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'delete_task',
    description:
      '仅删除当前登录用户自己的任务数据。不能改功能页面。调用后必须由用户确认。',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
];

export function isWriteAssistantTool(name) {
  return WRITE_TOOLS.has(name);
}

/** Reject any attempt to scope tools to another account. */
export function assertOwnScopeArgs(args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {};
  for (const key of Object.keys(args)) {
    if (CROSS_USER_KEYS.has(key)) {
      throw new Error('禁止访问其他用户的信息；助手只能操作当前登录账号本人数据');
    }
  }
  return args;
}

function ownershipMeta(user) {
  return {
    scope: 'self_only',
    ownerUsername: user.username,
    ownerDisplayName: user.displayName || user.username,
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    date: row.date,
    planDay: row.plan_day,
    planName: row.plan_name,
    time: row.time || '',
    category: row.category,
    title: row.title,
    description: row.description || '',
    durationLabel: row.duration_label || '',
    durationMinutes: row.duration_minutes ?? null,
    templateKey: row.template_key || null,
    completed: Boolean(row.completed),
    sortOrder: row.sort_order,
  };
}

function assertDate(date) {
  if (!DATE_RE.test(String(date || ''))) throw new Error('日期必须是 YYYY-MM-DD');
  if (planDayForDate(date) === null) throw new Error('日期早于健康计划开始时间');
}

function assertTime(time) {
  if (time && !TIME_RE.test(String(time))) throw new Error('时间必须是 HH:mm');
}

export function executeReadAssistantTool(name, rawArgs, user) {
  if (!user?.id) throw new Error('缺少登录用户上下文');
  const args = assertOwnScopeArgs(rawArgs);
  const db = getDb();

  if (name === 'list_tasks') {
    assertDate(args.date);
    const rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY time, sort_order'
    ).all(user.id, args.date);
    return {
      ...ownershipMeta(user),
      date: args.date,
      tasks: rows.map(rowToTask),
      progress: {
        total: rows.length,
        completed: rows.filter((row) => row.completed === 1).length,
      },
    };
  }

  if (name === 'search_recipes') {
    const libraryUserId = ensureRecipeLibraryUser(db);
    const clauses = [
      "(r.user_id = @libraryUserId OR (r.user_id = @userId AND r.source = 'custom'))",
      "r.source != 'other'",
    ];
    const query = String(args.query || '').trim().slice(0, 80);
    const params = {
      userId: user.id,
      libraryUserId,
      limit: Math.min(10, Math.max(1, Number(args.limit) || 6)),
    };
    if (query) {
      clauses.push('(r.title LIKE @query OR r.ingredients LIKE @query OR r.tags LIKE @query)');
      params.query = `%${query}%`;
    }
    if (args.meal_type) {
      clauses.push('r.meal_type = @mealType');
      params.mealType = args.meal_type;
    }
    const rows = db.prepare(`
      SELECT r.id, r.title, r.meal_type, r.ingredients, r.notes,
             r.prep_minutes, r.calories, r.tags, r.series, r.template_key,
             CASE WHEN r.user_id = @libraryUserId THEN 'shared_library' ELSE 'private' END AS visibility
      FROM recipes r
      WHERE ${clauses.join(' AND ')}
      ORDER BY r.updated_at DESC, r.id DESC
      LIMIT @limit
    `).all(params);
    return {
      ...ownershipMeta(user),
      recipes: rows.map((row) => ({
        id: row.id,
        title: row.title,
        mealType: row.meal_type,
        ingredients: row.ingredients,
        notes: row.notes,
        prepMinutes: row.prep_minutes,
        calories: row.calories,
        tags: row.tags,
        series: row.series,
        templateKey: row.template_key,
        visibility: row.visibility,
      })),
    };
  }

  throw new Error(`不支持的读取工具：${name}`);
}

function actionSummary(toolName, args, userId) {
  const db = getDb();
  if (toolName === 'create_task') {
    return `创建任务：${args.date} ${args.time || ''}「${args.title}」`;
  }
  const task = db.prepare(
    'SELECT id, date, time, title FROM tasks WHERE id = ? AND user_id = ?'
  ).get(Number(args.task_id), userId);
  if (!task) throw new Error('任务不存在或无权操作');
  if (toolName === 'delete_task') return `删除任务：${task.date} ${task.time || ''}「${task.title}」`;
  const changes = [];
  if (args.completed !== undefined) changes.push(args.completed ? '标记完成' : '恢复未完成');
  if (args.title !== undefined) changes.push(`标题改为「${args.title}」`);
  if (args.time !== undefined) changes.push(`时间改为 ${args.time || '无时间'}`);
  if (args.description !== undefined) changes.push('更新详情');
  return `修改任务：${task.date}「${task.title}」；${changes.join('，') || '无有效变更'}`;
}

export function createPendingAssistantAction({
  userId, sessionId = null, callId, responseId, toolName, args,
}) {
  if (!isWriteAssistantTool(toolName)) throw new Error('该工具不需要确认');
  const safeArgs = assertOwnScopeArgs(args);
  if (toolName === 'create_task') {
    assertDate(safeArgs.date);
    assertTime(safeArgs.time);
    if (!String(safeArgs.title || '').trim() || !String(safeArgs.category || '').trim()) {
      throw new Error('创建任务需要标题和分类');
    }
    if (safeArgs.category === '早餐') {
      throw new Error('早餐必须从食谱库选择，助手不能创建未关联食谱的早餐');
    }
  }
  if (toolName === 'update_task') {
    assertTime(safeArgs.time);
    if (!Number.isInteger(Number(safeArgs.task_id))) throw new Error('任务 ID 无效');
  }
  if (toolName === 'delete_task' && !Number.isInteger(Number(safeArgs.task_id))) {
    throw new Error('任务 ID 无效');
  }

  const id = randomUUID();
  const summary = actionSummary(toolName, safeArgs, userId);
  getDb().prepare(`
    INSERT INTO assistant_actions (
      id, user_id, session_id, tool_name, arguments, call_id, response_id, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+15 minutes'))
  `).run(id, userId, sessionId || null, toolName, JSON.stringify(safeArgs), callId, responseId || null);
  return { id, toolName, arguments: safeArgs, summary, expiresInMinutes: 15 };
}

export function getPendingAssistantAction(actionId, userId) {
  const row = getDb().prepare(`
    SELECT * FROM assistant_actions
    WHERE id = ? AND user_id = ? AND status = 'pending' AND expires_at > datetime('now')
  `).get(actionId, userId);
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id || null,
    toolName: row.tool_name,
    arguments: JSON.parse(row.arguments),
    callId: row.call_id,
    responseId: row.response_id,
  };
}

function executeCreateTask(db, userId, args) {
  assertDate(args.date);
  assertTime(args.time);
  const planDay = planDayForDate(args.date);
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) AS n FROM tasks WHERE user_id = ? AND date = ?'
  ).get(userId, args.date).n;
  const inferred = inferDuration(args.title, args.category, planDay);
  const result = db.prepare(`
    INSERT INTO tasks (
      user_id, date, plan_day, plan_name, time, category, title, description,
      duration_label, duration_minutes, completed, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    userId,
    args.date,
    planDay,
    PLAN_META[planDay - 1]?.name || '',
    args.time || '',
    args.category,
    String(args.title).trim(),
    String(args.description || '').trim(),
    inferred.durationLabel || '',
    inferred.durationMinutes,
    Number(maxOrder) + 1
  );
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  logTaskAction({ userId, taskId: row.id, action: 'create', afterRow: row });
  emitToUser(userId, 'task:sync', { type: 'create', task: rowToTask(row), date: row.date, at: Date.now() });
  return rowToTask(row);
}

function executeUpdateTask(db, userId, args) {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(Number(args.task_id), userId);
  if (!existing) throw new Error('任务不存在或无权操作');
  assertTime(args.time);

  const fields = [
    ['title', args.title, (value) => String(value).trim()],
    ['description', args.description, (value) => String(value)],
    ['time', args.time, (value) => String(value)],
    ['completed', args.completed, (value) => (value ? 1 : 0)],
  ];
  const updates = [];
  const params = { id: existing.id };
  const changes = {};
  for (const [column, value, transform] of fields) {
    if (value === undefined) continue;
    const next = transform(value);
    updates.push(`${column} = @${column}`);
    params[column] = next;
    changes[column] = { from: existing[column], to: next };
  }
  if (!updates.length) throw new Error('没有可更新的字段');
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = @id`).run(params);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(existing.id);
  const action = args.completed !== undefined ? 'complete' : 'update';
  logTaskAction({ userId, taskId: row.id, action, beforeRow: existing, afterRow: row, changes });
  emitToUser(userId, 'task:sync', { type: 'update', task: rowToTask(row), date: row.date, at: Date.now() });
  return rowToTask(row);
}

function executeDeleteTask(db, userId, args) {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(Number(args.task_id), userId);
  if (!existing) throw new Error('任务不存在或无权操作');
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(existing.id, userId);
  logTaskAction({ userId, taskId: existing.id, action: 'delete', beforeRow: existing });
  emitToUser(userId, 'task:sync', { type: 'delete', id: existing.id, date: existing.date, at: Date.now() });
  return { deleted: true, id: existing.id, title: existing.title, date: existing.date };
}

export function resolveAssistantAction(actionId, userId, approve) {
  const db = getDb();
  const action = getPendingAssistantAction(actionId, userId);
  if (!action) throw new Error('待确认操作不存在、已处理或已过期');

  if (!approve) {
    db.prepare(`
      UPDATE assistant_actions
      SET status = 'rejected', result = ?, resolved_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(JSON.stringify({ rejected: true }), actionId, userId);
    return { action, result: { rejected: true } };
  }

  const safeArgs = assertOwnScopeArgs(action.arguments);
  let result;
  const execute = db.transaction(() => {
    if (action.toolName === 'create_task') return executeCreateTask(db, userId, safeArgs);
    if (action.toolName === 'update_task') return executeUpdateTask(db, userId, safeArgs);
    if (action.toolName === 'delete_task') return executeDeleteTask(db, userId, safeArgs);
    throw new Error(`不支持的操作：${action.toolName}`);
  });
  result = execute();
  db.prepare(`
    UPDATE assistant_actions
    SET status = 'approved', result = ?, resolved_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(JSON.stringify(result), actionId, userId);
  return { action, result };
}
