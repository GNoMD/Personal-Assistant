/**
 * Generate landmarks-west.mjs from batch-c.json + curated western provinces.
 * Run: node scripts/spot-seeds/generate-landmarks-west.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CURATED_WEST_7 } from './landmarks-west-curated-7.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const batchC = JSON.parse(readFileSync(join(__dirname, 'batch-c.json'), 'utf8'));

const BATCH_C_PROVINCES = [
  'shanxi',
  'liaoning',
  'jilin',
  'heilongjiang',
  'chongqing',
  'sichuan',
  'guizhou',
  'yunnan',
];

function fromBatchC(provinceId) {
  const cityMap = Object.fromEntries((batchC.cities[provinceId] || []).map((c) => [c.id, c.name]));
  return batchC.spots
    .filter((s) => s.provinceId === provinceId)
    .map(({ cityId, name, category, area }) => ({
      cityId,
      cityName: cityMap[cityId] || area,
      name,
      category,
      area,
    }));
}

function serializeArray(name, items) {
  const lines = items.map(
    (s) =>
      `  { cityId: ${JSON.stringify(s.cityId)}, cityName: ${JSON.stringify(s.cityName)}, name: ${JSON.stringify(s.name)}, category: ${JSON.stringify(s.category)}, area: ${JSON.stringify(s.area)} }`,
  );
  return `const ${name} = [\n${lines.join(',\n')},\n];\n`;
}

const all = {};
for (const pid of BATCH_C_PROVINCES) {
  all[pid] = fromBatchC(pid);
}
for (const [pid, items] of Object.entries(CURATED_WEST_7)) {
  all[pid] = items;
}

const order = [
  'shanxi',
  'liaoning',
  'jilin',
  'heilongjiang',
  'chongqing',
  'sichuan',
  'guizhou',
  'yunnan',
  'shaanxi',
  'ningxia',
  'gansu',
  'qinghai',
  'neimenggu',
  'xinjiang',
  'xizang',
];

for (const pid of order) {
  const n = all[pid]?.length || 0;
  if (n < 110) {
    console.error(`${pid}: only ${n} spots (need >=110)`);
    process.exit(1);
  }
}

let out = '/** Western & northern province landmarks (>=110 per province). */\n\n';
for (const pid of order) {
  out += serializeArray(pid, all[pid]);
  out += '\n';
}
out += `export const LANDMARKS_WEST = { ${order.join(', ')} };\n`;

writeFileSync(join(__dirname, 'landmarks-west.mjs'), out, 'utf8');
console.log('Wrote landmarks-west.mjs');
for (const pid of order) console.log(`  ${pid}: ${all[pid].length}`);
