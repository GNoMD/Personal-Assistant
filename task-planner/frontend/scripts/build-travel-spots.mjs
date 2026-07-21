/**
 * 校验景点目录：福建抽取数量 + 各省景点数
 * 用法：node --input-type=module scripts/build-travel-spots.mjs
 *（在 frontend 目录执行）
 */
import { ALL_TRAVEL_SPOTS, FUJIAN_SPOTS, getProvincesWithSpots } from '../src/data/travelSpotsCatalog.js';

const provinces = getProvincesWithSpots();
console.log(`福建抽取: ${FUJIAN_SPOTS.length}`);
console.log(`全部景点: ${ALL_TRAVEL_SPOTS.length}`);
console.log(`有景点的省: ${provinces.length}`);
for (const p of provinces) {
  console.log(`  ${p.name}: ${p.spotCount}`);
}

const ids = new Set();
const dupes = [];
for (const s of ALL_TRAVEL_SPOTS) {
  if (ids.has(s.id)) dupes.push(s.id);
  ids.add(s.id);
}
if (dupes.length) {
  console.error('重复 id:', dupes);
  process.exit(1);
}
console.log('id 唯一性: ok');
