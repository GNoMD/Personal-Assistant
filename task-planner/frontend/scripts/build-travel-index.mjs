/**
 * 从全国行程数据生成助手用 travelIndex.json
 * 用法（frontend）: node scripts/build-travel-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NATIONAL_TRAVEL_PLANS, TRAVEL_DURATIONS } from '../src/data/travel.js';
import { getCityInProvince, getProvinceById } from '../src/data/travelGeo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, '../../backend/src/catalog/travelIndex.json');

const durationLabel = Object.fromEntries(TRAVEL_DURATIONS.map((d) => [d.id, d.label]));

function planSpotNames(plan) {
  if (plan.spots?.length) return plan.spots.map((s) => s.name).filter(Boolean);
  if (plan.days?.length) {
    return plan.days.flatMap((day) => (day.spots || []).map((s) => s.name)).filter(Boolean);
  }
  return [];
}

function main() {
  const index = [];
  for (const [provinceId, cities] of Object.entries(NATIONAL_TRAVEL_PLANS)) {
    const province = getProvinceById(provinceId);
    for (const [cityId, byDuration] of Object.entries(cities || {})) {
      const city = getCityInProvince(provinceId, cityId);
      for (const [durationId, plans] of Object.entries(byDuration || {})) {
        for (const plan of plans || []) {
          index.push({
            id: plan.id,
            provinceId,
            provinceName: province?.name || '',
            cityId,
            cityName: city?.name || '',
            durationId,
            durationLabel: durationLabel[durationId] || durationId,
            title: plan.title,
            summary: plan.summary,
            route: plan.route,
            bestFor: plan.bestFor,
            spots: planSpotNames(plan),
          });
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(index)}\n`, 'utf8');
  console.log(`wrote ${index.length} plans -> ${outPath}`);
}

main();
