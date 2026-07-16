import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = path.join(__dirname, '../catalog');

function loadJson(name) {
  const filePath = path.join(CATALOG_DIR, name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const FITNESS_INDEX = loadJson('fitnessIndex.json');
const TRAVEL_INDEX = loadJson('travelIndex.json');

const DURATION_HINT = {
  half: '约 5 小时',
  '1day': '约 9 小时',
  '2day': '2 天',
  '3day': '3 天',
  '4day': '4 天',
  '5day': '5 天及以上',
};

const SPORT_DURATION = {
  running: '约 30 分钟',
  swimming: '约 40 分钟',
  walking: '约 40 分钟',
};

function scoreText(haystack, query) {
  const h = String(haystack || '').toLowerCase();
  const q = String(query || '').trim().toLowerCase();
  if (!q) return 0;
  if (h === q) return 100;
  if (h.includes(q)) return 60;
  const parts = q.split(/[\s,，、]+/).filter(Boolean);
  let score = 0;
  for (const part of parts) {
    if (h.includes(part)) score += 20;
  }
  return score;
}

export function searchFitnessCatalog({ query = '', kind = '', limit = 8 } = {}) {
  const max = Math.min(12, Math.max(1, Number(limit) || 8));
  const kindFilter = String(kind || '').trim();
  const q = String(query || '').trim();
  let rows = FITNESS_INDEX.filter((item) => {
    if (kindFilter && item.kind !== kindFilter) return false;
    return true;
  });
  if (q) {
    rows = rows
      .map((item) => ({
        item,
        score:
          scoreText(item.id, q) * 1.2
          + scoreText(item.name, q) * 1.5
          + scoreText(item.summary, q)
          + scoreText((item.muscles || []).join(' '), q),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.item);
  }
  return rows.slice(0, max).map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    kindLabel: item.kind === 'sport' ? '运动' : '器械',
    summary: item.summary,
    muscles: item.muscles,
    level: item.level,
  }));
}

export function getFitnessCatalogItem(idOrName) {
  const key = String(idOrName || '').trim().toLowerCase();
  if (!key) return null;
  return (
    FITNESS_INDEX.find((item) => item.id === key)
    || FITNESS_INDEX.find((item) => item.name.toLowerCase() === key)
    || FITNESS_INDEX.find((item) => item.name.includes(String(idOrName).trim()))
    || null
  );
}

export function fitnessItemToTaskFields(item, overrides = {}) {
  const isSport = item.kind === 'sport';
  const muscles = (item.muscles || []).join('、');
  const steps = (item.howTo || []).slice(0, 3).join('；');
  return {
    title: overrides.title
      || (isSport ? `有氧运动：${item.name}` : `器械训练：${item.name}`),
    description: overrides.description || [
      item.summary,
      muscles ? (isSport ? `侧重：${muscles}` : `主要肌群：${muscles}`) : '',
      steps ? `要点：${steps}` : '',
      `详情页：/equipment/${item.id}`,
    ].filter(Boolean).join('\n'),
    category: '运动',
    time: overrides.time || '',
    durationLabel: overrides.durationLabel
      || (isSport ? (SPORT_DURATION[item.id] || '约 30 分钟') : '约 45 分钟'),
    durationMinutes: overrides.durationMinutes ?? (isSport
      ? (item.id === 'swimming' || item.id === 'walking' ? 40 : 30)
      : 45),
  };
}

export function searchTravelCatalog({
  query = '',
  city = '',
  duration = '',
  limit = 8,
} = {}) {
  const max = Math.min(12, Math.max(1, Number(limit) || 8));
  const q = String(query || '').trim();
  const cityKey = String(city || '').trim().toLowerCase();
  const durationKey = String(duration || '').trim().toLowerCase();

  let rows = TRAVEL_INDEX.filter((plan) => {
    if (cityKey) {
      const cityOk = plan.cityId === cityKey
        || plan.cityName.toLowerCase() === cityKey
        || plan.cityName.includes(String(city).trim());
      if (!cityOk) return false;
    }
    if (durationKey) {
      const durationOk = plan.durationId === durationKey
        || plan.durationLabel.toLowerCase() === durationKey
        || plan.durationLabel.includes(String(duration).trim());
      if (!durationOk) return false;
    }
    return true;
  });

  if (q) {
    rows = rows
      .map((plan) => ({
        plan,
        score:
          scoreText(plan.id, q)
          + scoreText(plan.title, q) * 1.5
          + scoreText(plan.summary, q)
          + scoreText(plan.route, q)
          + scoreText((plan.spots || []).join(' '), q)
          + scoreText(plan.cityName, q),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.plan);
  }

  return rows.slice(0, max).map((plan) => ({
    id: plan.id,
    cityId: plan.cityId,
    cityName: plan.cityName,
    durationId: plan.durationId,
    durationLabel: plan.durationLabel,
    title: plan.title,
    summary: plan.summary,
    route: plan.route,
    bestFor: plan.bestFor,
    spots: plan.spots,
  }));
}

export function getTravelCatalogPlan(idOrTitle, { city = '', duration = '' } = {}) {
  const key = String(idOrTitle || '').trim();
  if (!key) return null;
  const exact = TRAVEL_INDEX.find((plan) => plan.id === key);
  if (exact) return exact;
  const hits = searchTravelCatalog({ query: key, city, duration, limit: 1 });
  return hits[0]
    ? TRAVEL_INDEX.find((plan) => plan.id === hits[0].id) || null
    : null;
}

export function travelPlanToTaskFields(plan, overrides = {}) {
  return {
    title: overrides.title
      || [plan.cityName, plan.durationLabel, plan.title].filter(Boolean).join(' · '),
    description: overrides.description || [
      plan.summary,
      plan.route ? `路线：${plan.route}` : '',
      (plan.spots || []).length ? `景点：${plan.spots.join('、')}` : '',
      plan.bestFor ? `适合：${plan.bestFor}` : '',
      '详情页：/travel',
    ].filter(Boolean).join('\n'),
    category: '旅行',
    time: overrides.time || '',
    durationLabel: overrides.durationLabel || DURATION_HINT[plan.durationId] || plan.durationLabel || '',
    durationMinutes: overrides.durationMinutes ?? null,
  };
}
