/**
 * 全国旅行地理树：省 → 市
 * 城市列表由 scripts/build-travel-spots-rich.mjs 生成后同步
 */

import generated from './travelGeo.generated.js';

/** @typedef {{ id: string, name: string }} GeoCity */
/** @typedef {{ id: string, name: string, shortName?: string, cities: GeoCity[] }} GeoProvince */

/** @type {GeoProvince[]} */
export const TRAVEL_PROVINCES = generated.provinces;

/** 福建计划城市所属省（行程抽取关联用） */
export const FUJIAN_PLAN_CITY_PROVINCE = 'fujian';

export function getProvinceById(provinceId) {
  return TRAVEL_PROVINCES.find((p) => p.id === provinceId) || null;
}

export function getCityInProvince(provinceId, cityId) {
  const province = getProvinceById(provinceId);
  return province?.cities.find((c) => c.id === cityId) || null;
}

export function getAllCities() {
  return TRAVEL_PROVINCES.flatMap((p) =>
    p.cities.map((c) => ({ ...c, provinceId: p.id, provinceName: p.name }))
  );
}
