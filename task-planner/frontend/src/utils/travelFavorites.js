/**
 * 旅行收藏（按登录用户隔离，本地持久化）
 */

function storageKey(userId) {
  return `travel-favorites:u:${userId || 'anon'}`;
}

export function loadTravelFavorites(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const data = raw ? JSON.parse(raw) : {};
    return {
      planIds: new Set(Array.isArray(data.planIds) ? data.planIds : []),
      spotIds: new Set(Array.isArray(data.spotIds) ? data.spotIds : []),
    };
  } catch {
    return { planIds: new Set(), spotIds: new Set() };
  }
}

export function saveTravelFavorites(userId, { planIds, spotIds }) {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({
        planIds: [...(planIds || [])],
        spotIds: [...(spotIds || [])],
      })
    );
  } catch {
    /* ignore quota */
  }
}
