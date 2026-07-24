/**
 * 从 Wikidata 拉取各城市「有知名度」的真实景点（旅游景点/博物馆/公园等），
 * 带中文名、坐标与所在行政区，不硬凑数量。
 *
 *   node scripts/spot-seeds/fetch-wikidata-landmarks.mjs
 *   node scripts/spot-seeds/fetch-wikidata-landmarks.mjs --city=xiamen --force
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geo from '../../src/data/travelGeo.generated.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'landmarks-wikidata.json');
const cacheDir = path.join(__dirname, '.wikidata-cache');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const ONLY_PROVINCE = args.province ? String(args.province) : '';
const ONLY_CITY = args.city ? String(args.city) : '';
const FORCE = Boolean(args.force);
const ENDPOINT = 'https://query.wikidata.org/sparql';

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

/** Wikidata 类：旅游景点、博物馆、公园、寺庙、动物园、主题公园、海滩、自然保护区等 */
const CLASS_FILTER = `
  ?item wdt:P31/wdt:P279* ?class .
  VALUES ?class {
    wd:Q570116   # tourist attraction
    wd:Q33506    # museum
    wd:Q22698    # park
    wd:Q16917    # temple / Buddhist temple often via subclasses
    wd:Q32815    # mosque? skip
    wd:Q34627    # synagogue skip
    wd:Q16970    # church
    wd:Q44613    # monastery
    wd:Q24354    # theatre
    wd:Q43501    # zoo
    wd:Q241972  # theme park? use Q2419728
    wd:Q2419728  # theme park
    wd:Q40050    # beach
    wd:Q473972   # protected area
    wd:Q839954   # archaeological site
    wd:Q839079   # castle? 
    wd:Q23413    # castle
    wd:Q16560    # palace
    wd:Q207694   # art museum
    wd:Q33506
    wd:Q1081138  # historic site? 
  }
`;

fs.mkdirSync(cacheDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function provinceLabel(provinceName) {
  if (['北京', '天津', '上海', '重庆'].includes(provinceName)) return `${provinceName}市`;
  if (provinceName === '内蒙古') return '内蒙古自治区';
  if (provinceName === '西藏') return '西藏自治区';
  if (provinceName === '广西') return '广西壮族自治区';
  if (provinceName === '宁夏') return '宁夏回族自治区';
  if (provinceName === '新疆') return '新疆维吾尔自治区';
  return `${provinceName}省`;
}

function citySearchNames(cityName, provinceName) {
  const names = new Set();
  names.add(cityName);
  if (!/[市区县州盟旗]$/.test(cityName)) names.add(`${cityName}市`);
  // Shanghai/Beijing districts
  if (['北京', '天津', '上海', '重庆'].includes(provinceName)) {
    if (!cityName.endsWith('区') && !cityName.endsWith('县')) names.add(`${cityName}区`);
  }
  return [...names];
}

function categoryFromClasses(classLabels = []) {
  const text = classLabels.join(' ');
  if (/博物馆|美术馆|展览/.test(text)) return '博物馆';
  if (/主题公园|游乐园|动物园|水族/.test(text)) return '主题乐园';
  if (/寺|庙|教堂|清真寺|道观|修道院/.test(text)) return '宗教寺庙';
  if (/海滩|湖|水库|湿地|滨/.test(text)) return '海滨湖泊';
  if (/山|峡谷|峰|崖/.test(text)) return '山地峡谷';
  if (/公园|园林|花园/.test(text)) return '公园休闲';
  if (/古镇|街区|步行街|老街/.test(text)) return '古镇街区';
  if (/购物|市场|商街/.test(text)) return '美食购物';
  if (/遗址|古迹|宫殿|城堡|纪念|历史/.test(text)) return '历史人文';
  return '自然风光';
}

function buildSparql(adminLabel) {
  // 位于该行政区（P131*）的景点类实体
  return `
SELECT DISTINCT ?item ?itemLabel ?coord ?adminLabel ?classLabel WHERE {
  ?admin rdfs:label "${adminLabel}"@zh .
  ?item wdt:P131* ?admin .
  ?item wdt:P31/wdt:P279* ?class .
  VALUES ?class {
    wd:Q570116 wd:Q33506 wd:Q22698 wd:Q16970 wd:Q44613
    wd:Q24354 wd:Q43501 wd:Q2419728 wd:Q40050 wd:Q473972
    wd:Q839954 wd:Q23413 wd:Q16560 wd:Q207694 wd:Q839079
    wd:Q1086266 wd:Q35657 wd:Q125191
  }
  OPTIONAL { ?item wdt:P625 ?coord . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "zh,zh-cn,zh-hans,en". }
}
LIMIT 200
`.trim();
}

async function queryWikidata(sparql) {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'PersonalAssistantTravelBot/1.0 (local seed builder)',
    },
  });
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  return res.json();
}

function parseCoord(wkt) {
  // Point(118.08 24.44)
  const m = String(wkt || '').match(/Point\(([-\d.]+)\s+([-\d.]+)\)/i);
  if (!m) return {};
  return { lng: Number(Number(m[1]).toFixed(6)), lat: Number(Number(m[2]).toFixed(6)) };
}

function isUsableName(name) {
  if (!name || name.length < 2) return false;
  if (/^Q\d+$/i.test(name)) return false;
  if (/^[A-Za-z0-9\s\-_.]+$/.test(name) && !/[\u4e00-\u9fff]/.test(name)) return false;
  if (/(厕所|停车场|入口|出口|售票)/.test(name)) return false;
  return /[\u4e00-\u9fff]/.test(name);
}

function normalizeKey(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/(风景区|景区|旅游区)$/g, '');
}

function rowsToSpots(rows, { provinceId, cityId, cityName, provinceName }) {
  const byName = new Map();
  for (const row of rows) {
    const name = row.itemLabel?.value || '';
    if (!isUsableName(name)) continue;
    const admin = row.adminLabel?.value || '';
    const classLabel = row.classLabel?.value || '';
    const { lat, lng } = parseCoord(row.coord?.value);
    const area = admin && admin !== cityName && admin !== `${cityName}市`
      ? admin.replace(/(市|省|自治区|特别行政区)$/g, '')
      : cityName;
    // Prefer more specific admin when it's a district
    let areaOut = cityName;
    if (/[区县]$/.test(admin) || /[区县]/.test(admin)) {
      areaOut = admin;
    } else if (admin.includes(cityName) && admin !== cityName && admin !== `${cityName}市`) {
      areaOut = admin;
    }

    const location = [
      provinceLabel(provinceName),
      cityName.endsWith('市') || cityName.endsWith('区') || cityName.endsWith('县') ? cityName : `${cityName}市`,
      areaOut !== cityName && areaOut !== `${cityName}市` ? areaOut : '',
    ].filter(Boolean).join('');

    const item = {
      cityId,
      cityName,
      name,
      category: categoryFromClasses([classLabel]),
      area: areaOut,
      location,
      lat,
      lng,
      source: 'wikidata',
      wikidata: (row.item?.value || '').split('/').pop(),
    };
    const key = normalizeKey(name);
    if (!byName.has(key)) byName.set(key, item);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

async function fetchCity(meta) {
  const cachePath = path.join(cacheDir, `${meta.provinceId}-${meta.cityId}.json`);
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const labels = citySearchNames(meta.cityName, meta.provinceName);
  const merged = new Map();
  for (const label of labels) {
    const sparql = buildSparql(label);
    try {
      const data = await queryWikidata(sparql);
      const rows = data?.results?.bindings || [];
      for (const spot of rowsToSpots(rows, meta)) {
        merged.set(normalizeKey(spot.name), spot);
      }
    } catch (err) {
      // try next label
      if (labels.indexOf(label) === labels.length - 1) throw err;
    }
    await sleep(400);
  }

  const spots = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  const payload = { fetchedAt: new Date().toISOString(), spots };
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

async function main() {
  const existing = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
    : { provinces: {} };
  const provinces = { ...(existing.provinces || {}) };
  let cityCount = 0;

  for (const province of geo.provinces || []) {
    if (ONLY_PROVINCE && province.id !== ONLY_PROVINCE) continue;
    if (!provinces[province.id] || (FORCE && !ONLY_CITY)) provinces[province.id] = [];
    if (FORCE && ONLY_CITY) {
      provinces[province.id] = (provinces[province.id] || []).filter((s) => s.cityId !== ONLY_CITY);
    }

    for (const city of province.cities || []) {
      if (ONLY_CITY && city.id !== ONLY_CITY) continue;
      cityCount += 1;
      const meta = {
        provinceId: province.id,
        provinceName: PROVINCE_NAMES[province.id] || province.name,
        cityId: city.id,
        cityName: city.name,
      };
      process.stdout.write(`wd ${meta.provinceId}/${meta.cityId} ${meta.cityName} ... `);
      try {
        const { spots } = await fetchCity(meta);
        provinces[province.id] = [
          ...(provinces[province.id] || []).filter((s) => s.cityId !== city.id),
          ...spots,
        ];
        console.log(`${spots.length}`);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
      await sleep(700 + Math.random() * 500);
      if (cityCount % 3 === 0) {
        fs.writeFileSync(
          outPath,
          JSON.stringify({ generatedAt: new Date().toISOString(), provinces }, null, 2),
          'utf8'
        );
      }
    }
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), provinces }, null, 2),
    'utf8'
  );
  let total = 0;
  for (const list of Object.values(provinces)) total += list.length;
  console.log(`done cities=${cityCount} spots=${total} -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
