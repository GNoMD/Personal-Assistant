import rich from '../src/data/travelSpotsRich.js';
import photoMap from '../src/data/travelSpotPhotoMap.js';

const spots = rich.spots || [];
console.log('spotCount header:', rich.spotCount);
console.log('spots.length:', spots.length);
console.log('provinceCount:', rich.provinceCount);
console.log('generatedAt:', rich.generatedAt);

const s = spots[0];
console.log('sample keys:', Object.keys(s).sort().join(', '));
console.log('sample spot:', JSON.stringify(s, null, 2).slice(0, 1500));

const byCity = new Map();
for (const spot of spots) {
  const key = spot.provinceId + '/' + spot.cityId;
  byCity.set(key, (byCity.get(key) || 0) + 1);
}
const counts = [...byCity.values()].sort((a, b) => a - b);
const sum = counts.reduce((a, b) => a + b, 0);
const avg = sum / counts.length;
const min = counts[0];
const max = counts[counts.length - 1];
const under100 = counts.filter((c) => c < 100).length;
console.log('cities:', byCity.size);
console.log('min:', min, 'avg:', avg.toFixed(2), 'max:', max);
console.log('cities <100:', under100);
console.log('cities >=100:', counts.filter((c) => c >= 100).length);

const sorted = [...byCity.entries()].sort((a, b) => b[1] - a[1]);
console.log('top 15:', sorted.slice(0, 15).map(([k, v]) => k + ':' + v).join(', '));
console.log('bottom 15:', sorted.slice(-15).map(([k, v]) => k + ':' + v).join(', '));

// distribution buckets
const buckets = { '1-9': 0, '10-49': 0, '50-99': 0, '100+': 0 };
for (const c of counts) {
  if (c < 10) buckets['1-9'] += 1;
  else if (c < 50) buckets['10-49'] += 1;
  else if (c < 100) buckets['50-99'] += 1;
  else buckets['100+'] += 1;
}
console.log('buckets:', JSON.stringify(buckets));

const photoKeys = Object.keys(photoMap);
let with3 = 0;
let with1to2 = 0;
let with0 = 0;
for (const spot of spots) {
  const e = photoMap[spot.id];
  const n = Array.isArray(e?.localPaths) ? e.localPaths.length : e?.localPath ? 1 : 0;
  if (n >= 3) with3 += 1;
  else if (n >= 1) with1to2 += 1;
  else with0 += 1;
}
console.log('photoMap entries:', photoKeys.length);
console.log('spots with 3+ photos:', with3);
console.log('spots with 1-2 photos:', with1to2);
console.log('spots with 0 photos:', with0);

const byProv = new Map();
for (const spot of spots) {
  byProv.set(spot.provinceId, (byProv.get(spot.provinceId) || 0) + 1);
}
console.log(
  'per province:',
  [...byProv.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => k + ':' + v)
    .join(', ')
);

// seed landmark counts if we can import
try {
  const { LANDMARKS_EAST } = await import('./spot-seeds/landmarks-east.mjs');
  const { LANDMARKS_CENTRAL } = await import('./spot-seeds/landmarks-central.mjs');
  const { LANDMARKS_WEST } = await import('./spot-seeds/landmarks-west.mjs');
  const countLandmarks = (obj) =>
    Object.values(obj).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);
  console.log('seed east:', countLandmarks(LANDMARKS_EAST), 'provinces', Object.keys(LANDMARKS_EAST).length);
  console.log('seed central:', countLandmarks(LANDMARKS_CENTRAL), 'provinces', Object.keys(LANDMARKS_CENTRAL).length);
  console.log('seed west:', countLandmarks(LANDMARKS_WEST), 'provinces', Object.keys(LANDMARKS_WEST).length);
  console.log(
    'seed total:',
    countLandmarks(LANDMARKS_EAST) + countLandmarks(LANDMARKS_CENTRAL) + countLandmarks(LANDMARKS_WEST)
  );
} catch (e) {
  console.log('seed import error', e.message);
}
