/**
 * 清理 photo map：只保留当前 travelSpotsRich 中仍存在的景点。
 *   node scripts/clean-spot-photo-map.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rich from '../src/data/travelSpotsRich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mapPath = path.join(root, 'src/data/travelSpotPhotoMap.json');
const mapJsPath = path.join(root, 'src/data/travelSpotPhotoMap.js');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const keep = new Set((rich.spots || []).map((s) => s.id));
let removed = 0;
for (const id of Object.keys(map)) {
  if (!keep.has(id)) {
    delete map[id];
    removed += 1;
  }
}
fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf8');
fs.writeFileSync(
  mapJsPath,
  `/* auto-generated */\nexport default ${JSON.stringify(map)};\n`,
  'utf8'
);
console.log(`kept=${Object.keys(map).length} removed=${removed}`);
