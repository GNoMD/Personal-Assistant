/**
 * 景点目录：全国详述景点库
 * 配图仅使用网上按景点名检索下载的实拍（travelSpotPhotoMap），无图则占位，绝不串图
 */

import { CITY_TRAVEL_PLANS } from './travel.js';
import { FUJIAN_PLAN_CITY_PROVINCE, TRAVEL_PROVINCES, getCityInProvince, getProvinceById } from './travelGeo.js';
import rich from './travelSpotsRich.js';
import photoMap from './travelSpotPhotoMap.js';
import addressMap from './travelSpotAddressMap.js';
import hoursMap from './travelSpotHoursMap.js';
import parkingMap from './travelSpotParkingMap.js';
import planIndex from './travelSpotPlanIndex.js';

/** @typedef {{
 *  id: string,
 *  name: string,
 *  provinceId: string,
 *  cityId: string,
 *  area?: string,
 *  location?: string,
 *  address?: string,
 *  mapQuery?: string,
 *  lat?: number,
 *  lng?: number,
 *  openHours?: string,
 *  openHoursNote?: string,
 *  parking?: {
 *    name?: string,
 *    hint?: string,
 *    distanceText?: string,
 *    walkNote?: string,
 *    mapQuery?: string,
 *    lat?: number,
 *    lng?: number,
 *    distanceMeters?: number,
 *    source?: string
 *  },
 *  duration?: string,
 *  category?: string,
 *  summary?: string,
 *  tip?: string,
 *  intro?: string,
 *  tips?: string[],
 *  highlights?: string[],
 *  coverImage?: string,
 *  images?: string[],
 *  fallbackCover?: string,
 *  imageNote?: string,
 *  bestSeason?: string,
 *  ticketHint?: string,
 *  sourcePlanIds?: string[]
 * }} CatalogSpot */

const NO_PHOTO = '/travel-covers/no-photo.svg';

/** @type {CatalogSpot[]} */
const RICH_SPOTS = Array.isArray(rich.spots) ? rich.spots : [];
const PHOTO_MAP = photoMap && typeof photoMap === 'object' ? photoMap : {};
const ADDRESS_MAP = addressMap && typeof addressMap === 'object' ? addressMap : {};
const HOURS_MAP = hoursMap && typeof hoursMap === 'object' ? hoursMap : {};
const PARKING_MAP = parkingMap && typeof parkingMap === 'object' ? parkingMap : {};
const PLAN_INDEX_BY_SPOT =
  planIndex && typeof planIndex === 'object' && planIndex.bySpotId && typeof planIndex.bySpotId === 'object'
    ? planIndex.bySpotId
    : {};

function collectFujianPlanLinks() {
  /** @type {Map<string, string[]>} */
  const map = new Map();
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
          const list = map.get(key) || [];
          if (!list.includes(plan.id)) list.push(plan.id);
          map.set(key, list);
        }
      }
    }
  }
  return map;
}

function attachRealPhoto(spot) {
  const entry = PHOTO_MAP[spot.id];
  const paths = [];
  if (Array.isArray(entry?.localPaths)) {
    for (const p of entry.localPaths) {
      if (p && !paths.includes(p)) paths.push(p);
    }
  }
  if (entry?.localPath && !paths.includes(entry.localPath)) {
    paths.unshift(entry.localPath);
  }

  if (paths.length > 0) {
    const images = [...paths];
    while (images.length < 3) images.push(NO_PHOTO);
    return {
      ...spot,
      coverImage: paths[0],
      images: images.slice(0, 3),
      fallbackCover: NO_PHOTO,
      imageNote: paths.length >= 3
        ? '配图为按景点名网上检索下载的相关实拍图（3 张）'
        : `配图为按景点名网上检索下载的相关实拍图（已有 ${paths.length}/3，补齐中）`,
    };
  }
  return {
    ...spot,
    coverImage: NO_PHOTO,
    images: [NO_PHOTO, NO_PHOTO, NO_PHOTO],
    fallbackCover: NO_PHOTO,
    imageNote: '暂未检索到可下载的景点实拍图（下载任务进行中）',
  };
}

function attachAddress(spot) {
  const entry = ADDRESS_MAP[spot.id] || {};
  const address = entry.address || spot.address || spot.location || '';
  const mapQuery = entry.mapQuery || [spot.location || '', spot.name].filter(Boolean).join('');
  const lat = typeof entry.lat === 'number' ? entry.lat : spot.lat;
  const lng = typeof entry.lng === 'number' ? entry.lng : spot.lng;
  return {
    ...spot,
    address,
    mapQuery,
    ...(typeof lat === 'number' ? { lat } : {}),
    ...(typeof lng === 'number' ? { lng } : {}),
  };
}

function attachHours(spot) {
  const entry = HOURS_MAP[spot.id] || {};
  return {
    ...spot,
    openHours: entry.openHours || spot.openHours || '',
    openHoursNote: entry.note || spot.openHoursNote || '具体以景区/场馆官方当日公告为准。',
  };
}

function attachParking(spot) {
  const entry = PARKING_MAP[spot.id] || {};
  if (!entry.parkingName && !entry.mapQuery) {
    const mapQuery = [spot.location || spot.address || '', spot.name, '停车场'].filter(Boolean).join('');
    return {
      ...spot,
      parking: {
        name: `${spot.name} · 附近停车场`,
        hint: '请用高德/百度搜索「景点名 + 停车场」，选步行距离最短的。',
        distanceText: '打开地图搜索最近停车场',
        mapQuery,
        source: 'fallback',
      },
    };
  }
  return {
    ...spot,
    parking: {
      name: entry.parkingName,
      hint: entry.hint || '',
      distanceText: entry.distanceText || '',
      walkNote: entry.walkNote || '',
      mapQuery: entry.mapQuery || '',
      source: entry.source || '',
      ...(typeof entry.lat === 'number' ? { lat: entry.lat } : {}),
      ...(typeof entry.lng === 'number' ? { lng: entry.lng } : {}),
      ...(typeof entry.distanceMeters === 'number' ? { distanceMeters: entry.distanceMeters } : {}),
    },
  };
}

function attachRelatedPlans(spot) {
  const fromIndex = PLAN_INDEX_BY_SPOT[spot.id] || [];
  const fujianIds = FUJIAN_LINKS.get(`${spot.cityId}::${spot.name}`) || [];
  /** @type {string[]} */
  const mergedIds = [];
  for (const planId of [...fromIndex, ...fujianIds]) {
    if (!planId || mergedIds.includes(planId)) continue;
    mergedIds.push(planId);
  }
  return {
    ...spot,
    sourcePlanIds: mergedIds,
  };
}

const FUJIAN_LINKS = collectFujianPlanLinks();

/** @type {CatalogSpot[]} */
export const ALL_TRAVEL_SPOTS = RICH_SPOTS.map((spot) =>
  attachRelatedPlans(attachParking(attachHours(attachAddress(attachRealPhoto(spot)))))
);

const SPOT_BY_ID = new Map(ALL_TRAVEL_SPOTS.map((s) => [s.id, s]));
const SPOT_BY_CITY_NAME = new Map(
  ALL_TRAVEL_SPOTS.map((s) => [`${s.provinceId}::${s.cityId}::${s.name}`, s])
);

export function getSpotById(spotId) {
  if (!spotId) return null;
  const raw = String(spotId);
  if (SPOT_BY_ID.has(raw)) return SPOT_BY_ID.get(raw);
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw && SPOT_BY_ID.has(decoded)) return SPOT_BY_ID.get(decoded);
  } catch {
    /* ignore */
  }
  return null;
}

export function getSpotByCityAndName(provinceId, cityId, name) {
  if (!provinceId || !cityId || !name) return null;
  return SPOT_BY_CITY_NAME.get(`${provinceId}::${cityId}::${name}`) || null;
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

export function getProvincesWithSpots() {
  return TRAVEL_PROVINCES
    .map((p) => ({
      ...p,
      spotCount: getSpotCountByProvince(p.id),
    }))
    .filter((p) => p.spotCount > 0);
}

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
  if (spot?.address) return spot.address;
  if (spot?.location) return spot.location;
  const province = getProvinceById(spot.provinceId);
  const city = getCityInProvince(spot.provinceId, spot.cityId);
  return [province?.name, city?.name, spot?.area].filter(Boolean).join(' · ');
}

export function getSpotCover(spot) {
  return spot?.coverImage || spot?.images?.[0] || NO_PHOTO;
}

export function getSpotPhotoStats() {
  const total = ALL_TRAVEL_SPOTS.length;
  const withPhoto = ALL_TRAVEL_SPOTS.filter((s) => s.coverImage && s.coverImage !== NO_PHOTO).length;
  const withThree = ALL_TRAVEL_SPOTS.filter(
    (s) => (s.images || []).filter((img) => img && img !== NO_PHOTO).length >= 3
  ).length;
  return { total, withPhoto, withThree, missing: total - withPhoto };
}

function scoreMatch(text, query) {
  const t = String(text || '').toLowerCase();
  const q = String(query || '').trim().toLowerCase();
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  return 0;
}

/**
 * 景点 Tab 全局搜索：省 / 市 / 景点
 * @returns {{ provinces: any[], cities: any[], spots: any[] }}
 */
export function searchTravelSpotsCatalog(query, { limit = 8 } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { provinces: [], cities: [], spots: [] };

  const provinces = getProvincesWithSpots()
    .map((p) => ({
      item: p,
      score: Math.max(scoreMatch(p.name, q), scoreMatch(p.id, q), scoreMatch(p.shortName, q)),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);

  const cities = [];
  for (const province of getProvincesWithSpots()) {
    for (const city of getCitiesWithSpots(province.id)) {
      const cityScore = Math.max(scoreMatch(city.name, q), scoreMatch(city.id, q));
      if (cityScore <= 0) continue;
      cities.push({
        ...city,
        provinceId: province.id,
        provinceName: province.name,
        _score: cityScore,
      });
    }
  }
  cities.sort((a, b) => b._score - a._score);
  const cityHits = cities.slice(0, limit).map(({ _score, ...rest }) => rest);

  const spots = ALL_TRAVEL_SPOTS
    .map((spot) => ({
      spot,
      score: Math.max(
        scoreMatch(spot.name, q),
        scoreMatch(spot.category, q),
        ...(spot.highlights || []).map((h) => scoreMatch(h, q))
      ),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.spot);

  return { provinces, cities: cityHits, spots };
}
