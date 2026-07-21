/**
 * 景点目录：福建从行程抽取 + 外省全国主线精选
 */

import { CITY_TRAVEL_PLANS } from './travel.js';
import { FUJIAN_PLAN_CITY_PROVINCE, TRAVEL_PROVINCES, getCityInProvince, getProvinceById } from './travelGeo.js';
import { CURATED_TRAVEL_SPOTS } from './travelSpotsCurated.js';

/** @typedef {{ id: string, name: string, provinceId: string, cityId: string, area?: string, duration?: string, tip?: string, highlights?: string[], sourcePlanIds?: string[] }} CatalogSpot */

/** 纯 ASCII 短哈希，避免中文 id 导致路由打不开 */
function shortHash(text) {
  let h = 2166136261;
  const str = String(text || '');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function mergeHighlights(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const item of list || []) {
      if (!item || seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

/** 从福建行程抽取景点 */
function extractFujianSpots() {
  /** @type {Map<string, CatalogSpot>} */
  const map = new Map();
  const usedIds = new Set();

  function uniqueId(cityId, name) {
    const base = `fj-${cityId}-${shortHash(name)}`;
    if (!usedIds.has(base)) {
      usedIds.add(base);
      return base;
    }
    let n = 2;
    while (usedIds.has(`${base}-${n}`)) n += 1;
    const id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  }

  for (const [cityId, byDuration] of Object.entries(CITY_TRAVEL_PLANS)) {
    if (!getCityInProvince(FUJIAN_PLAN_CITY_PROVINCE, cityId)) continue;

    for (const plans of Object.values(byDuration)) {
      for (const plan of plans || []) {
        const nested = [
          ...(plan.spots || []),
          ...((plan.days || []).flatMap((d) => d.spots || [])),
        ];
        for (const spot of nested) {
          if (!spot?.name) continue;
          const key = `${cityId}::${spot.name}`;
          const existing = map.get(key);
          if (existing) {
            existing.sourcePlanIds = [...new Set([...(existing.sourcePlanIds || []), plan.id])];
            if (!existing.tip && spot.tip) existing.tip = spot.tip;
            if (!existing.area && spot.area) existing.area = spot.area;
            if (!existing.duration && spot.duration) existing.duration = spot.duration;
            existing.highlights = mergeHighlights(existing.highlights, spot.highlights);
          } else {
            map.set(key, {
              id: uniqueId(cityId, spot.name),
              name: spot.name,
              provinceId: FUJIAN_PLAN_CITY_PROVINCE,
              cityId,
              area: spot.area,
              duration: spot.duration,
              tip: spot.tip,
              highlights: [...(spot.highlights || [])],
              sourcePlanIds: [plan.id],
            });
          }
        }
      }
    }
  }

  return [...map.values()];
}

const FUJIAN_SPOTS = extractFujianSpots();

/** @type {CatalogSpot[]} */
export const ALL_TRAVEL_SPOTS = [...FUJIAN_SPOTS, ...CURATED_TRAVEL_SPOTS];

const SPOT_BY_ID = new Map(ALL_TRAVEL_SPOTS.map((s) => [s.id, s]));

export function getSpotById(spotId) {
  if (!spotId) return null;
  const raw = String(spotId);
  if (SPOT_BY_ID.has(raw)) return SPOT_BY_ID.get(raw);
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw && SPOT_BY_ID.has(decoded)) return SPOT_BY_ID.get(decoded);
  } catch {
    /* ignore malformed encoding */
  }
  return null;
}

export function getSpotsByCity(provinceId, cityId) {
  return ALL_TRAVEL_SPOTS.filter((s) => s.provinceId === provinceId && s.cityId === cityId);
}

export function getSpotCountByCity(provinceId, cityId) {
  return getSpotsByCity(provinceId, cityId).length;
}

export function getSpotCountByProvince(provinceId) {
  return ALL_TRAVEL_SPOTS.filter((s) => s.provinceId === provinceId).length;
}

/** 有景点的省（按 TRAVEL_PROVINCES 顺序） */
export function getProvincesWithSpots() {
  return TRAVEL_PROVINCES
    .map((p) => ({
      ...p,
      spotCount: getSpotCountByProvince(p.id),
    }))
    .filter((p) => p.spotCount > 0);
}

/** 某省下有景点的市 */
export function getCitiesWithSpots(provinceId) {
  const province = getProvinceById(provinceId);
  if (!province) return [];
  return province.cities
    .map((c) => ({
      ...c,
      provinceId,
      provinceName: province.name,
      spotCount: getSpotCountByCity(provinceId, c.id),
    }))
    .filter((c) => c.spotCount > 0);
}

export function getSpotLocationLabel(spot) {
  const province = getProvinceById(spot.provinceId);
  const city = getCityInProvince(spot.provinceId, spot.cityId);
  return [province?.name, city?.name].filter(Boolean).join(' · ');
}

export { FUJIAN_SPOTS };
