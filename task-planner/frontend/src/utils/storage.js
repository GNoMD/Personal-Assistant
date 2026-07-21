const LEGACY_CACHE_KEY = 'task-planner-cache';
const LEGACY_PENDING_KEY = 'task-planner-pending';
const SCOPE_KEY = 'task-planner-cache-user';
const PURGE_FLAG = 'task-planner-cache-purge-v2';

let activeUserId = null;

function cacheKey(userId = activeUserId) {
  if (userId == null || userId === '') return null;
  return `task-planner-cache:u:${userId}`;
}

function pendingKey(userId = activeUserId) {
  if (userId == null || userId === '') return null;
  return `task-planner-pending:u:${userId}`;
}

/** Remove unscoped + any task planner day caches (one-shot + on logout). */
export function clearAllTaskCaches() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key === LEGACY_CACHE_KEY
      || key === LEGACY_PENDING_KEY
      || key === SCOPE_KEY
      || key.startsWith('task-planner-cache:')
      || key.startsWith('task-planner-pending:')
    ) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
  activeUserId = null;
}

/** Drop leftover shared-browser cache from older builds once. */
export function purgeLegacyTaskCachesOnce() {
  try {
    if (localStorage.getItem(PURGE_FLAG) === '1') return false;
    clearAllTaskCaches();
    localStorage.setItem(PURGE_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

purgeLegacyTaskCachesOnce();

export function setCacheUser(userId) {
  activeUserId = userId == null || userId === '' ? null : String(userId);
  try {
    if (activeUserId) localStorage.setItem(SCOPE_KEY, activeUserId);
    else localStorage.removeItem(SCOPE_KEY);
  } catch {
    /* ignore */
  }
}

export function getCacheUser() {
  if (activeUserId != null) return activeUserId;
  try {
    const stored = localStorage.getItem(SCOPE_KEY);
    if (stored) activeUserId = stored;
  } catch {
    /* ignore */
  }
  return activeUserId;
}

export function loadCache() {
  const key = cacheKey();
  if (!key) return { days: {}, calendar: {} };
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { days: {}, calendar: {} };
  } catch {
    return { days: {}, calendar: {} };
  }
}

export function saveCache(cache) {
  const key = cacheKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(cache));
}

/** 非防脱账号不应缓存/回显用药按摩任务 */
function looksLikeHairCareTask(task) {
  const title = String(task?.title || '');
  const category = String(task?.category || '');
  if (category === '用药' || category === '按摩') return true;
  if (title === '晚间洗发' || title === '晨间洗发') return true;
  if (title === '晨间护肤' || title === '晚间护肤') return true;
  return /米诺|非那|头皮按摩|SSM/.test(title);
}

export function isHairCareDayPayload(data) {
  const tasks = data?.tasks;
  if (!Array.isArray(tasks) || !tasks.length) return false;
  return tasks.some(looksLikeHairCareTask);
}

export function cacheDay(date, data) {
  if (!cacheKey()) return;
  const cache = loadCache();
  cache.days[date] = { data, cachedAt: Date.now() };
  saveCache(cache);
}

export function getCachedDay(date, options = {}) {
  if (!cacheKey()) return null;
  const entry = loadCache().days[date];
  if (!entry?.data) return null;
  if (options.rejectHairCare && isHairCareDayPayload(entry.data)) {
    return null;
  }
  return entry.data;
}

export function cacheCalendar(key, data) {
  if (!cacheKey()) return;
  const cache = loadCache();
  cache.calendar[key] = { data, cachedAt: Date.now() };
  saveCache(cache);
}

export function getCachedCalendar(key) {
  if (!cacheKey()) return null;
  return loadCache().calendar[key]?.data ?? null;
}

export function loadPending() {
  const key = pendingKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePending(queue) {
  const key = pendingKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(queue));
}

export function enqueuePending(item) {
  const queue = loadPending();
  const idx = queue.findIndex((q) => q.id === item.id && q.type === item.type);
  if (idx >= 0) queue[idx] = item;
  else queue.push(item);
  savePending(queue);
}

export function removePending(id, type = 'update') {
  savePending(loadPending().filter((q) => !(q.id === id && q.type === type)));
}

export function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayLabel(dateStr) {
  const labels = ['日', '一', '二', '三', '四', '五', '六'];
  return labels[parseDate(dateStr).getDay()];
}
