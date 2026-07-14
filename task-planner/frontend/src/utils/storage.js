const CACHE_KEY = 'task-planner-cache';
const PENDING_KEY = 'task-planner-pending';

export function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : { days: {}, calendar: {} };
  } catch {
    return { days: {}, calendar: {} };
  }
}

export function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function cacheDay(date, data) {
  const cache = loadCache();
  cache.days[date] = { data, cachedAt: Date.now() };
  saveCache(cache);
}

export function getCachedDay(date) {
  return loadCache().days[date]?.data ?? null;
}

export function cacheCalendar(key, data) {
  const cache = loadCache();
  cache.calendar[key] = { data, cachedAt: Date.now() };
  saveCache(cache);
}

export function getCachedCalendar(key) {
  return loadCache().calendar[key]?.data ?? null;
}

export function loadPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePending(queue) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
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
