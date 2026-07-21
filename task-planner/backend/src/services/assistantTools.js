import { randomUUID } from 'crypto';
import { ensureRecipeLibraryUser, getDb } from '../db.js';
import { planDayForDate, PLAN_META } from '../seed/planData.js';
import { inferDuration } from '../seed/durationMap.js';
import { logTaskAction } from './audit.js';
import { emitToUser } from '../socket.js';
import {
  fitnessItemToTaskFields,
  getFitnessCatalogItem,
  getTravelCatalogPlan,
  searchFitnessCatalog,
  searchTravelCatalog,
  travelPlanToTaskFields,
} from './assistantCatalog.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const WRITE_TOOLS = new Set([
  'create_task',
  'update_task',
  'delete_task',
  'create_recipe',
  'schedule_fitness',
  'schedule_travel',
  'set_fitness_favorite',
]);
const MEAL_TYPES = new Set(['早餐', '午餐', '晚餐', '加餐', '饮品']);
const TASK_CATEGORIES = new Set([
  '作息', '早餐', '午餐', '下午茶', '晚餐', '夜宵', '用药', '护理', '运动', '清单', '食谱', '旅行', '自定义',
]);
const RECIPE_TITLE_MAX = 120;
const RECIPE_TEXT_MAX = 8000;
const CROSS_USER_KEYS = new Set([
  'user_id', 'userId', 'username', 'user_name', 'owner', 'owner_id', 'ownerId',
  'target_user', 'targetUser', 'other_user', 'otherUser', 'account', 'account_id',
]);

export const ASSISTANT_TOOLS = [
  {
    type: 'function',
    name: 'list_tasks',
    description:
      '只读取当前登录用户某一天的任务清单（可按分类筛选，如运动/旅行）。用于一句话改任务前先定位条目。不能查询其他用户；不能修改页面或系统功能；不要传 user_id/username。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '日期，格式 YYYY-MM-DD' },
        category: {
          type: 'string',
          description: '可选分类过滤，如 运动、旅行、清单、用药',
          enum: [...TASK_CATEGORIES],
        },
        query: { type: 'string', description: '可选：按标题/描述关键词过滤' },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'search_fitness',
    description:
      '搜索健身图鉴（器械/有氧运动）。安排或修改运动任务前可先搜索拿到 item_id。不能改页面；不要传 user_id。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '名称或肌群关键词，如 卧推、跑步、背' },
        kind: { type: 'string', enum: ['equipment', 'sport'] },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'search_travel',
    description:
      '搜索福建旅行计划图鉴。安排或修改旅行任务前可先搜索拿到 plan_id。不能改页面；不要传 user_id。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '景点/主题关键词，如 鼓浪屿、武夷山' },
        city: { type: 'string', description: '城市名或 id，如 厦门 / xiamen' },
        duration: { type: 'string', description: '时长，如 半日游 / half / 两日游 / 2day' },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
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
    name: 'create_recipe',
    description:
      '为当前登录用户新增一条私人食谱到本人食谱库（source=custom，系列默认「我的定制」）。调用后立即执行，无需用户再次确认。不能写入公共共享库，不能改功能页面；不要传 user_id/username。',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '食谱名称' },
        ingredients: { type: 'string', description: '食材清单，可换行或顿号分隔' },
        steps: { type: 'string', description: '制作步骤' },
        meal_type: { type: 'string', enum: ['早餐', '午餐', '晚餐', '加餐', '饮品'] },
        notes: { type: 'string', description: '备注/小贴士，可空' },
        prep_minutes: { type: 'integer', minimum: 1, maximum: 600, description: '预计耗时（分钟）' },
        calories: { type: 'integer', minimum: 0, maximum: 5000, description: '热量估算，可空' },
        tags: { type: 'string', description: '标签，逗号分隔，可空' },
        series: { type: 'string', description: '系列名，默认「我的定制」' },
      },
      required: ['title', 'ingredients', 'steps'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'create_task',
    description:
      '为当前用户新增任务清单条目（含运动/旅行/清单等分类）。调用后立即执行。早餐勿用本工具。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        title: { type: 'string' },
        category: { type: 'string', enum: [...TASK_CATEGORIES] },
        time: { type: 'string', description: 'HH:mm，可留空' },
        description: { type: 'string' },
        duration_label: { type: 'string', description: '如 约 30 分钟' },
        duration_minutes: { type: 'integer', minimum: 1, maximum: 1440 },
      },
      required: ['date', 'title', 'category'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'update_task',
    description:
      '修改当前用户任务清单中的一条（标题/描述/时间/日期/分类/时长/完成状态）。用于一句话改任务、改健身安排或改旅行行程任务。调用后立即执行。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
        date: { type: 'string', description: '改到哪一天 YYYY-MM-DD' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: [...TASK_CATEGORIES] },
        time: { type: 'string', description: 'HH:mm，空字符串表示清除时间' },
        duration_label: { type: 'string' },
        duration_minutes: { type: 'integer', minimum: 1, maximum: 1440 },
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
      '删除当前用户任务清单中的一条（含运动/旅行任务）。调用后立即执行。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
      },
      required: ['task_id'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'schedule_fitness',
    description:
      '按健身图鉴把器械/有氧运动安排到指定日期的任务清单（category=运动）。可用 item_id 或中文名。调用后立即执行。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        item_id: { type: 'string', description: '图鉴 id，如 smith-machine、running' },
        item_name: { type: 'string', description: '或中文名，如 史密斯机、跑步' },
        time: { type: 'string', description: 'HH:mm，默认 19:00' },
        title: { type: 'string', description: '可覆盖默认标题' },
        description: { type: 'string', description: '可覆盖默认描述' },
        duration_minutes: { type: 'integer', minimum: 1, maximum: 300 },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'schedule_travel',
    description:
      '按旅行图鉴把行程安排到指定日期任务清单（category=旅行）。优先传 plan_id；也可用城市+时长+关键词匹配。调用后立即执行。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        plan_id: { type: 'string', description: '旅行计划 id' },
        query: { type: 'string', description: '计划标题/景点关键词' },
        city: { type: 'string', description: '城市，如 厦门' },
        duration: { type: 'string', description: '时长，如 半日游' },
        time: { type: 'string', description: 'HH:mm，可空' },
        title: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'set_fitness_favorite',
    description:
      '收藏或取消收藏健身图鉴条目。调用后立即执行。不能改功能页面。',
    parameters: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: '图鉴 id' },
        is_favorite: { type: 'boolean' },
      },
      required: ['item_id', 'is_favorite'],
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
    let rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY time, sort_order'
    ).all(user.id, args.date);
    if (args.category) {
      if (!TASK_CATEGORIES.has(args.category)) throw new Error('任务分类无效');
      rows = rows.filter((row) => row.category === args.category);
    }
    const query = String(args.query || '').trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) => {
        const hay = `${row.title || ''}\n${row.description || ''}`.toLowerCase();
        return hay.includes(query);
      });
    }
    return {
      ...ownershipMeta(user),
      date: args.date,
      category: args.category || null,
      query: query || null,
      tasks: rows.map(rowToTask),
      progress: {
        total: rows.length,
        completed: rows.filter((row) => row.completed === 1).length,
      },
    };
  }

  if (name === 'search_fitness') {
    return {
      ...ownershipMeta(user),
      items: searchFitnessCatalog({
        query: args.query,
        kind: args.kind,
        limit: args.limit,
      }),
    };
  }

  if (name === 'search_travel') {
    return {
      ...ownershipMeta(user),
      plans: searchTravelCatalog({
        query: args.query,
        city: args.city,
        duration: args.duration,
        limit: args.limit,
      }),
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
  if (toolName === 'create_recipe') {
    return `新增食谱：${args.meal_type || '未分类'}「${String(args.title || '').trim()}」`;
  }
  if (toolName === 'schedule_fitness') {
    return `安排运动：${args.date}「${args.item_name || args.item_id || '健身'}」`;
  }
  if (toolName === 'schedule_travel') {
    return `安排旅行：${args.date}「${args.plan_id || args.query || args.city || '行程'}」`;
  }
  if (toolName === 'set_fitness_favorite') {
    return `${args.is_favorite ? '收藏' : '取消收藏'}运动：${args.item_id}`;
  }
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
  if (args.date !== undefined) changes.push(`日期改为 ${args.date}`);
  if (args.category !== undefined) changes.push(`分类改为 ${args.category}`);
  if (args.duration_label !== undefined || args.duration_minutes !== undefined) {
    changes.push('更新时长');
  }
  if (args.description !== undefined) changes.push('更新详情');
  return `修改任务：${task.date}「${task.title}」；${changes.join('，') || '无有效变更'}`;
}

export function createPendingAssistantAction({
  userId, sessionId = null, callId, responseId, toolName, args,
}) {
  if (!isWriteAssistantTool(toolName)) throw new Error('该工具不是写操作');
  const safeArgs = assertOwnScopeArgs(args);
  validateWriteArgs(toolName, safeArgs);

  const id = randomUUID();
  const summary = actionSummary(toolName, safeArgs, userId);
  getDb().prepare(`
    INSERT INTO assistant_actions (
      id, user_id, session_id, tool_name, arguments, call_id, response_id, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+15 minutes'))
  `).run(id, userId, sessionId || null, toolName, JSON.stringify(safeArgs), callId, responseId || null);
  return { id, toolName, arguments: safeArgs, summary, expiresInMinutes: 15 };
}

function normalizeRecipeWriteArgs(args) {
  const title = String(args.title || '').trim();
  const ingredients = String(args.ingredients || '').trim();
  const steps = String(args.steps || '').trim();
  const mealType = String(args.meal_type || '早餐').trim() || '早餐';
  const notes = String(args.notes || '').trim();
  const tags = String(args.tags || '').trim();
  const series = String(args.series || '我的定制').trim() || '我的定制';
  const prepRaw = args.prep_minutes;
  const calRaw = args.calories;
  const prepMinutes = prepRaw === undefined || prepRaw === null || prepRaw === ''
    ? null
    : Number(prepRaw);
  const calories = calRaw === undefined || calRaw === null || calRaw === ''
    ? null
    : Number(calRaw);

  if (!title) throw new Error('食谱名称必填');
  if (!ingredients) throw new Error('至少填写一种食材');
  if (!steps) throw new Error('请填写制作步骤');
  if (title.length > RECIPE_TITLE_MAX) throw new Error('食谱名称过长');
  if (ingredients.length > RECIPE_TEXT_MAX || steps.length > RECIPE_TEXT_MAX) {
    throw new Error('食材或步骤内容过长');
  }
  if (notes.length > RECIPE_TEXT_MAX || tags.length > 500 || series.length > 80) {
    throw new Error('备注、标签或系列过长');
  }
  if (!MEAL_TYPES.has(mealType)) throw new Error('餐次类型无效');
  if (prepMinutes != null && (!Number.isFinite(prepMinutes) || prepMinutes < 1 || prepMinutes > 600)) {
    throw new Error('预计耗时无效');
  }
  if (calories != null && (!Number.isFinite(calories) || calories < 0 || calories > 5000)) {
    throw new Error('热量数值无效');
  }

  return {
    title,
    ingredients,
    steps,
    meal_type: mealType,
    notes,
    tags,
    series,
    prep_minutes: prepMinutes == null ? null : Math.round(prepMinutes),
    calories: calories == null ? null : Math.round(calories),
  };
}

function parseOptionalDurationMinutes(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 1440) throw new Error('时长分钟数无效');
  return Math.round(n);
}

function validateWriteArgs(toolName, safeArgs) {
  if (toolName === 'create_recipe') {
    Object.assign(safeArgs, normalizeRecipeWriteArgs(safeArgs));
    return;
  }
  if (toolName === 'create_task') {
    assertDate(safeArgs.date);
    assertTime(safeArgs.time);
    if (!String(safeArgs.title || '').trim() || !String(safeArgs.category || '').trim()) {
      throw new Error('创建任务需要标题和分类');
    }
    if (!TASK_CATEGORIES.has(safeArgs.category)) throw new Error('任务分类无效');
    if (safeArgs.category === '早餐') {
      throw new Error('早餐必须从食谱库选择，助手不能创建未关联食谱的早餐');
    }
    if (safeArgs.duration_minutes !== undefined) {
      safeArgs.duration_minutes = parseOptionalDurationMinutes(safeArgs.duration_minutes);
    }
  }
  if (toolName === 'update_task') {
    assertTime(safeArgs.time);
    if (!Number.isInteger(Number(safeArgs.task_id))) throw new Error('任务 ID 无效');
    if (safeArgs.date !== undefined) assertDate(safeArgs.date);
    if (safeArgs.category !== undefined) {
      if (!TASK_CATEGORIES.has(safeArgs.category)) throw new Error('任务分类无效');
      if (safeArgs.category === '早餐') {
        throw new Error('不能把任务改成未关联食谱的早餐分类');
      }
    }
    if (safeArgs.duration_minutes !== undefined) {
      safeArgs.duration_minutes = parseOptionalDurationMinutes(safeArgs.duration_minutes);
    }
  }
  if (toolName === 'delete_task' && !Number.isInteger(Number(safeArgs.task_id))) {
    throw new Error('任务 ID 无效');
  }
  if (toolName === 'schedule_fitness') {
    assertDate(safeArgs.date);
    assertTime(safeArgs.time);
    if (!safeArgs.item_id && !safeArgs.item_name) {
      throw new Error('安排运动需要 item_id 或 item_name');
    }
    if (safeArgs.duration_minutes !== undefined) {
      safeArgs.duration_minutes = parseOptionalDurationMinutes(safeArgs.duration_minutes);
    }
  }
  if (toolName === 'schedule_travel') {
    assertDate(safeArgs.date);
    assertTime(safeArgs.time);
    if (!safeArgs.plan_id && !safeArgs.query && !safeArgs.city) {
      throw new Error('安排旅行需要 plan_id，或 city/query 用于匹配');
    }
  }
  if (toolName === 'set_fitness_favorite') {
    const itemId = String(safeArgs.item_id || '').trim();
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(itemId)) throw new Error('无效的健身条目 ID');
    if (typeof safeArgs.is_favorite !== 'boolean') throw new Error('is_favorite 必须是布尔值');
    safeArgs.item_id = itemId;
  }
}

/** 立即执行写工具（任务创建/修改/删除），无需二次确认。 */
export function executeWriteAssistantTool(name, rawArgs, user) {
  if (!isWriteAssistantTool(name)) throw new Error(`不支持的写操作：${name}`);
  if (!user?.id) throw new Error('缺少登录用户上下文');
  const safeArgs = assertOwnScopeArgs(rawArgs);
  validateWriteArgs(name, safeArgs);
  const db = getDb();
  const result = db.transaction(() => {
    if (name === 'create_recipe') return executeCreateRecipe(db, user.id, safeArgs);
    if (name === 'create_task') return executeCreateTask(db, user.id, safeArgs);
    if (name === 'update_task') return executeUpdateTask(db, user.id, safeArgs);
    if (name === 'delete_task') return executeDeleteTask(db, user.id, safeArgs);
    if (name === 'schedule_fitness') return executeScheduleFitness(db, user.id, safeArgs);
    if (name === 'schedule_travel') return executeScheduleTravel(db, user.id, safeArgs);
    if (name === 'set_fitness_favorite') return executeSetFitnessFavorite(db, user.id, safeArgs);
    throw new Error(`不支持的操作：${name}`);
  })();
  return {
    ...ownershipMeta(user),
    ok: true,
    toolName: name,
    result,
  };
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

function rowToRecipeSummary(row) {
  return {
    id: row.id,
    title: row.title,
    mealType: row.meal_type,
    ingredients: row.ingredients,
    steps: row.steps,
    notes: row.notes || '',
    prepMinutes: row.prep_minutes,
    calories: row.calories,
    tags: row.tags || '',
    series: row.series || '',
    source: row.source,
    visibility: 'private',
  };
}

function executeCreateRecipe(db, userId, args) {
  const normalized = normalizeRecipeWriteArgs(args);
  const result = db.prepare(`
    INSERT INTO recipes (
      user_id, title, meal_type, ingredients, steps, notes,
      prep_minutes, calories, tags, is_favorite, source, series
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'custom', ?)
  `).run(
    userId,
    normalized.title,
    normalized.meal_type,
    normalized.ingredients,
    normalized.steps,
    normalized.notes,
    normalized.prep_minutes,
    normalized.calories,
    normalized.tags,
    normalized.series
  );
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  return rowToRecipeSummary(row);
}

function executeCreateTask(db, userId, args) {
  assertDate(args.date);
  assertTime(args.time);
  const planDay = planDayForDate(args.date);
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) AS n FROM tasks WHERE user_id = ? AND date = ?'
  ).get(userId, args.date).n;
  const inferred = inferDuration(args.title, args.category, planDay);
  const durationLabel = args.duration_label !== undefined
    ? String(args.duration_label || '').trim()
    : (inferred.durationLabel || '');
  const durationMinutes = args.duration_minutes !== undefined
    ? args.duration_minutes
    : inferred.durationMinutes;
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
    durationLabel,
    durationMinutes ?? null,
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
    ['category', args.category, (value) => String(value).trim()],
    ['duration_label', args.duration_label, (value) => String(value || '').trim()],
    ['duration_minutes', args.duration_minutes, (value) => value],
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

  if (args.date !== undefined && args.date !== existing.date) {
    assertDate(args.date);
    const planDay = planDayForDate(args.date);
    updates.push('date = @date', 'plan_day = @plan_day', 'plan_name = @plan_name');
    params.date = args.date;
    params.plan_day = planDay;
    params.plan_name = PLAN_META[planDay - 1]?.name || '';
    changes.date = { from: existing.date, to: args.date };
  }

  if (!updates.length) throw new Error('没有可更新的字段');
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = @id`).run(params);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(existing.id);
  const action = args.completed !== undefined ? 'complete' : 'update';
  logTaskAction({ userId, taskId: row.id, action, beforeRow: existing, afterRow: row, changes });
  emitToUser(userId, 'task:sync', {
    type: 'update',
    task: rowToTask(row),
    date: row.date,
    previousDate: existing.date !== row.date ? existing.date : undefined,
    at: Date.now(),
  });
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

function executeScheduleFitness(db, userId, args) {
  const item = getFitnessCatalogItem(args.item_id || args.item_name);
  if (!item) throw new Error('未找到对应的健身器械/运动，请先 search_fitness');
  const overrides = {
    time: args.time || '19:00',
    title: args.title,
    description: args.description,
  };
  if (args.duration_minutes !== undefined) {
    overrides.durationMinutes = args.duration_minutes;
    overrides.durationLabel = `约 ${args.duration_minutes} 分钟`;
  }
  const fields = fitnessItemToTaskFields(item, overrides);
  return executeCreateTask(db, userId, {
    date: args.date,
    title: fields.title,
    category: fields.category,
    time: fields.time,
    description: fields.description,
    duration_label: fields.durationLabel,
    duration_minutes: fields.durationMinutes,
  });
}

function executeScheduleTravel(db, userId, args) {
  let plan = null;
  if (args.plan_id) {
    plan = getTravelCatalogPlan(args.plan_id);
  } else {
    const hits = searchTravelCatalog({
      query: args.query,
      city: args.city,
      duration: args.duration,
      limit: 1,
    });
    plan = hits[0] ? getTravelCatalogPlan(hits[0].id) : null;
  }
  if (!plan) throw new Error('未找到对应的旅行计划，请先 search_travel');
  const fields = travelPlanToTaskFields(plan, {
    time: args.time || '',
    title: args.title,
    description: args.description,
  });
  return executeCreateTask(db, userId, {
    date: args.date,
    title: fields.title,
    category: fields.category,
    time: fields.time,
    description: fields.description,
    duration_label: fields.durationLabel,
    duration_minutes: fields.durationMinutes,
  });
}

function executeSetFitnessFavorite(db, userId, args) {
  const item = getFitnessCatalogItem(args.item_id);
  if (!item) throw new Error('未找到对应的健身条目');
  if (args.is_favorite) {
    db.prepare(
      'INSERT OR IGNORE INTO fitness_favorites (user_id, item_id) VALUES (?, ?)'
    ).run(userId, item.id);
  } else {
    db.prepare(
      'DELETE FROM fitness_favorites WHERE user_id = ? AND item_id = ?'
    ).run(userId, item.id);
  }
  const itemIds = db.prepare(
    'SELECT item_id AS itemId FROM fitness_favorites WHERE user_id = ? ORDER BY created_at DESC, item_id ASC'
  ).all(userId).map((row) => row.itemId);
  return { itemId: item.id, name: item.name, isFavorite: args.is_favorite, itemIds };
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
  validateWriteArgs(action.toolName, safeArgs);
  const result = db.transaction(() => {
    if (action.toolName === 'create_recipe') return executeCreateRecipe(db, userId, safeArgs);
    if (action.toolName === 'create_task') return executeCreateTask(db, userId, safeArgs);
    if (action.toolName === 'update_task') return executeUpdateTask(db, userId, safeArgs);
    if (action.toolName === 'delete_task') return executeDeleteTask(db, userId, safeArgs);
    if (action.toolName === 'schedule_fitness') return executeScheduleFitness(db, userId, safeArgs);
    if (action.toolName === 'schedule_travel') return executeScheduleTravel(db, userId, safeArgs);
    if (action.toolName === 'set_fitness_favorite') return executeSetFitnessFavorite(db, userId, safeArgs);
    throw new Error(`不支持的操作：${action.toolName}`);
  })();
  db.prepare(`
    UPDATE assistant_actions
    SET status = 'approved', result = ?, resolved_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(JSON.stringify(result), actionId, userId);
  return { action, result };
}
