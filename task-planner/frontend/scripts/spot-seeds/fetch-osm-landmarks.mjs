/**
 * 从 OpenStreetMap Overpass 拉取各城市真实景点（有名称；优先带 Wikidata/Wikipedia）。
 * 不硬凑数量；写出 landmarks-osm.json 供 build 合并。
 *
 * 用法（frontend）:
 *   node scripts/spot-seeds/fetch-osm-landmarks.mjs
 *   node scripts/spot-seeds/fetch-osm-landmarks.mjs --province=fujian
 *   node scripts/spot-seeds/fetch-osm-landmarks.mjs --city=xiamen --force
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geo from '../../src/data/travelGeo.generated.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'landmarks-osm.json');
const cacheDir = path.join(__dirname, '.osm-cache');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const ONLY_PROVINCE = args.province ? String(args.province) : '';
const ONLY_CITY = args.city ? String(args.city) : '';
const FORCE = Boolean(args.force);
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const PROVINCE_NAMES = {
  fujian: '福建', guangdong: '广东', guangxi: '广西', hainan: '海南',
  zhejiang: '浙江', shanghai: '上海', jiangsu: '江苏', anhui: '安徽',
  jiangxi: '江西', hunan: '湖南', hubei: '湖北', henan: '河南',
  shandong: '山东', beijing: '北京', tianjin: '天津', hebei: '河北',
  shanxi: '山西', liaoning: '辽宁', jilin: '吉林', heilongjiang: '黑龙江',
  chongqing: '重庆', sichuan: '四川', guizhou: '贵州', yunnan: '云南',
  shaanxi: '陕西', ningxia: '宁夏', gansu: '甘肃', qinghai: '青海',
  neimenggu: '内蒙古', xinjiang: '新疆', xizang: '西藏',
};

const FAKE_NAME_RE = /(社区公园|文化驿站|观景节点|城市公园\d|步行街区\d|观景台\d|网红打卡墙|欢乐谷风格乐园|流动博物馆|临时展览馆|设计周展场)/;

fs.mkdirSync(cacheDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function categoryFromTags(tags = {}) {
  const tourism = tags.tourism || '';
  const historic = tags.historic || '';
  const leisure = tags.leisure || '';
  const amenity = tags.amenity || '';
  const natural = tags.natural || '';
  if (tourism === 'museum' || tourism === 'gallery') return '博物馆';
  if (tourism === 'zoo' || tourism === 'theme_park' || tourism === 'aquarium') return '主题乐园';
  if (tourism === 'viewpoint') return '自然风光';
  if (amenity === 'place_of_worship') return '宗教寺庙';
  if (amenity === 'theatre') return '历史人文';
  if (historic) return '历史人文';
  if (leisure === 'park' || leisure === 'garden') return '公园休闲';
  if (natural === 'beach' || tourism === 'beach_resort') return '海滨湖泊';
  if (natural === 'peak' || natural === 'cliff') return '山地峡谷';
  if (tourism === 'attraction') return '自然风光';
  return '历史人文';
}

function pickName(tags = {}) {
  return (
    tags['name:zh-Hans']
    || tags['name:zh']
    || tags.name
    || tags['name:en']
    || ''
  ).trim();
}

function pickArea(tags = {}, cityName) {
  return (
    tags['addr:district']
    || tags['addr:suburb']
    || tags['addr:neighbourhood']
    || tags['addr:city_district']
    || tags['is_in:city']
    || cityName
  );
}

function pickLocation(tags = {}, provinceName, cityName, area) {
  const parts = [
    provinceName.endsWith('市') || provinceName.endsWith('省') || provinceName === '内蒙古' || provinceName === '西藏' || provinceName === '广西'
      ? (['北京', '天津', '上海', '重庆'].includes(provinceName) ? provinceName : `${provinceName}${['内蒙古', '西藏', '广西', '宁夏', '新疆'].includes(provinceName) ? '' : ''}`)
      : provinceName,
  ];
  // normalize province label
  const provinceLabel = ['北京', '天津', '上海', '重庆'].includes(provinceName)
    ? `${provinceName}市`
    : ['内蒙古', '西藏', '广西', '宁夏', '新疆'].includes(provinceName)
      ? (provinceName === '内蒙古' ? '内蒙古自治区'
        : provinceName === '西藏' ? '西藏自治区'
          : provinceName === '广西' ? '广西壮族自治区'
            : provinceName === '宁夏' ? '宁夏回族自治区'
              : '新疆维吾尔自治区')
      : `${provinceName}省`;

  const cityLabel = cityName.endsWith('市') || cityName.endsWith('区') || cityName.endsWith('县')
    ? cityName
    : `${cityName}市`;
  const areaLabel = area && area !== cityName
    ? (area.endsWith('区') || area.endsWith('县') || area.endsWith('镇') || area.endsWith('街道') ? area : area)
    : '';

  const road = tags['addr:street'] || '';
  const housenumber = tags['addr:housenumber'] || '';
  const detail = [road, housenumber].filter(Boolean).join('');

  return [provinceLabel, cityLabel, areaLabel, detail].filter(Boolean).join('');
}

function scorePoi(tags = {}) {
  let score = 0;
  if (tags.wikidata) score += 8;
  if (tags.wikipedia || tags['wikipedia:zh']) score += 6;
  if (tags.tourism === 'attraction') score += 3;
  if (tags.tourism === 'museum' || tags.tourism === 'theme_park' || tags.tourism === 'zoo') score += 4;
  if (tags.historic) score += 3;
  if (tags['name:zh'] || tags['name:zh-Hans']) score += 2;
  if (tags['addr:district'] || tags['addr:suburb']) score += 1;
  if ((tags.name || '').length >= 3) score += 1;
  return score;
}

function isUsableName(name) {
  if (!name || name.length < 2) return false;
  if (FAKE_NAME_RE.test(name)) return false;
  if (/^[A-Za-z0-9\s\-_.]+$/.test(name)) return false; // skip pure English placeholders
  if (/厕所|停车场|入口|出口|售票处|游客中心$/.test(name)) return false;
  return true;
}

function buildQuery(cityNameZh) {
  // Prefer "厦门市"; also try bare city for districts like 黄浦
  const areaName = /[市区县州盟]$/.test(cityNameZh) ? cityNameZh : `${cityNameZh}市`;
  return `
[out:json][timeout:90];
(
  area["name"="${areaName}"]["boundary"="administrative"]->.searchArea;
);
(
  nwr["tourism"~"^(attraction|museum|zoo|theme_park|viewpoint|gallery|aquarium)$"](area.searchArea);
  nwr["historic"~"^(monument|memorial|castle|ruins|yes|tomb|archaeological_site)$"](area.searchArea);
  nwr["leisure"="park"]["wikidata"](area.searchArea);
  nwr["leisure"="garden"]["wikidata"](area.searchArea);
  nwr["amenity"="place_of_worship"]["wikidata"](area.searchArea);
  nwr["natural"="beach"](area.searchArea);
);
out center tags;
`.trim();
}

async function overpass(query) {
  let lastErr;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) throw new Error(`${endpoint} ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await sleep(1500);
    }
  }
  throw lastErr || new Error('overpass failed');
}

function normalizeKey(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/(风景区|景区|旅游区)$/g, '')
    .toLowerCase();
}

function elementsToSpots(elements, { provinceId, cityId, cityName, provinceName }) {
  const byName = new Map();
  for (const el of elements || []) {
    const tags = el.tags || {};
    const name = pickName(tags);
    if (!isUsableName(name)) continue;
    const score = scorePoi(tags);
    // 知名度门槛：有 wiki/wikidata，或明确 tourism/historic 且中文名
    const notable = Boolean(tags.wikidata || tags.wikipedia || tags['wikipedia:zh'])
      || ['museum', 'theme_park', 'zoo', 'aquarium', 'attraction', 'gallery'].includes(tags.tourism)
      || Boolean(tags.historic);
    if (!notable) continue;
    if (score < 3) continue;

    const area = pickArea(tags, cityName);
    const location = pickLocation(tags, provinceName, cityName, area);
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const item = {
      cityId,
      cityName,
      name,
      category: categoryFromTags(tags),
      area,
      location,
      lat: typeof lat === 'number' ? Number(lat.toFixed(6)) : undefined,
      lng: typeof lng === 'number' ? Number(lng.toFixed(6)) : undefined,
      source: 'osm',
      wikidata: tags.wikidata || '',
      score,
    };
    const key = normalizeKey(name);
    const prev = byName.get(key);
    if (!prev || item.score > prev.score) byName.set(key, item);
  }
  return [...byName.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh'));
}

async function fetchCity(cityMeta) {
  const cachePath = path.join(cacheDir, `${cityMeta.provinceId}-${cityMeta.cityId}.json`);
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }
  const query = buildQuery(cityMeta.cityName);
  const data = await overpass(query);
  const spots = elementsToSpots(data.elements || [], cityMeta);
  fs.writeFileSync(cachePath, JSON.stringify({ fetchedAt: new Date().toISOString(), spots }, null, 2), 'utf8');
  return { fetchedAt: new Date().toISOString(), spots };
}

async function main() {
  const existing = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
    : { generatedAt: '', provinces: {} };

  const provinces = {};
  let cityCount = 0;
  let spotCount = 0;

  for (const province of geo.provinces || []) {
    if (ONLY_PROVINCE && province.id !== ONLY_PROVINCE) continue;
    provinces[province.id] = existing.provinces?.[province.id]
      ? [...existing.provinces[province.id]]
      : [];

    // rebuild province list from scratch when forcing whole province/city
    if (FORCE && (ONLY_PROVINCE || ONLY_CITY)) {
      if (!ONLY_CITY) provinces[province.id] = [];
      else provinces[province.id] = provinces[province.id].filter((s) => s.cityId !== ONLY_CITY);
    }
    if (!ONLY_PROVINCE && !ONLY_CITY && FORCE) provinces[province.id] = [];

    for (const city of province.cities || []) {
      if (ONLY_CITY && city.id !== ONLY_CITY) continue;
      cityCount += 1;
      const meta = {
        provinceId: province.id,
        provinceName: PROVINCE_NAMES[province.id] || province.name,
        cityId: city.id,
        cityName: city.name,
      };
      process.stdout.write(`fetch ${meta.provinceId}/${meta.cityId} ${meta.cityName} ... `);
      try {
        const { spots } = await fetchCity(meta);
        // replace city entries
        provinces[province.id] = [
          ...provinces[province.id].filter((s) => s.cityId !== city.id),
          ...spots.map(({ score, ...rest }) => rest),
        ];
        spotCount += spots.length;
        console.log(`${spots.length} spots`);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
      await sleep(1200 + Math.random() * 800);
      // checkpoint
      if (cityCount % 5 === 0) {
        fs.writeFileSync(
          outPath,
          JSON.stringify({ generatedAt: new Date().toISOString(), provinces }, null, 2),
          'utf8'
        );
      }
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    provinces,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  let total = 0;
  for (const list of Object.values(provinces)) total += list.length;
  console.log(`done cities=${cityCount} osmSpots=${total} -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
