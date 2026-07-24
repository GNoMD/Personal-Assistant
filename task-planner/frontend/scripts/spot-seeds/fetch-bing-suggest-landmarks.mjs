/**
 * 用必应联想词补真实景点（比扫搜索正文干净）。
 * 结果合并进 landmarks-extra.json / .mjs（保留已有 mct-5a）。
 *
 *   node scripts/spot-seeds/fetch-bing-suggest-landmarks.mjs
 *   node scripts/spot-seeds/fetch-bing-suggest-landmarks.mjs --province=fujian
 *   node scripts/spot-seeds/fetch-bing-suggest-landmarks.mjs --city=xiamen --force
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geo from '../../src/data/travelGeo.generated.json' with { type: 'json' };
import { LANDMARKS_EAST } from './landmarks-east.mjs';
import { LANDMARKS_CENTRAL } from './landmarks-central.mjs';
import { LANDMARKS_WEST } from './landmarks-west.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outJson = path.join(__dirname, 'landmarks-extra.json');
const outMjs = path.join(__dirname, 'landmarks-extra.mjs');
const cacheDir = path.join(__dirname, '.suggest-cache');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const ONLY_PROVINCE = args.province ? String(args.province) : '';
const ONLY_CITY = args.city ? String(args.city) : '';
const FORCE = Boolean(args.force);

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

const ATTR_SUFFIX = /(风景名胜区|风景区|旅游区|旅游景区|文化旅游区|森林公园|湿地公园|地质公园|海洋公园|主题乐园|游乐园|动物园|植物园|博物院|博物馆|纪念馆|美术馆|科技馆|故居|遗址|古城|古镇|老街|步行街|炮台|沙滩|海滩|广场|公园|景区|寺|庙|祠|塔|宫|苑|园|山|峰|湖|湾|岛|屿|岩|洞|窟|峡|瀑布|陵|关|书院|学村|影视城)$/;

fs.mkdirSync(cacheDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nameKey(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/(旅游景区|风景名胜区|风景区|旅游区|景区)$/g, '')
    .toLowerCase();
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

function buildLocation(provinceName, cityName, area) {
  const city = /[市区县州盟旗]$/.test(cityName) ? cityName : `${cityName}市`;
  const areaPart = area && area !== cityName && area !== city ? area : '';
  return [provinceLabel(provinceName), city, areaPart].filter(Boolean).join('');
}

function guessCategory(name) {
  if (/博物|美术|科技|纪念馆/.test(name)) return '博物馆';
  if (/乐园|动物园|水族|方特|欢乐谷|迪士尼|海洋公园/.test(name)) return '主题乐园';
  if (/寺|庙|祠|教堂|清真寺|道观/.test(name)) return '宗教寺庙';
  if (/古镇|老街|步行街|古城/.test(name)) return '古镇街区';
  if (/沙滩|海滩|湖|湾|岛|屿|湿地|海滨/.test(name)) return '海滨湖泊';
  if (/山|峰|峡|岩|洞|窟|瀑布|关/.test(name)) return '山地峡谷';
  if (/公园|植物园|园林|花园|广场/.test(name)) return '公园休闲';
  return '历史人文';
}

function isCleanAttractionName(name) {
  const n = String(name || '').trim();
  if (n.length < 2 || n.length > 18) return false;
  if (!ATTR_SUFFIX.test(n)) return false;
  if (/\d/.test(n)) return false;
  if (/(著名景区|热门景区|4A景区|5A景区|必去景点|旅游景点|地形多山|景点地图|景点图片|景点推荐|景点介绍|最美古镇|周边)/.test(n)) return false;
  if (/^(原名|位于|地处|别称|著名|热门|必去|推荐|十大|盘点|当地|附近|周边|寺庙|景区|景点)/.test(n)) return false;
  if (/(位于|中国|旅游必去|充满|那座|地区|大陆|十大景点|必去十大|哪些|什么|怎么)/.test(n)) return false;
  const suffix = n.match(ATTR_SUFFIX)?.[0] || '';
  const stem = n.slice(0, n.length - suffix.length);
  if (stem.length < 2) return false;
  if (suffix.length <= 2 && stem.length > 6) return false;
  if (stem.length > 10) return false;
  if (/^(著名|热门|必去|推荐|当地|附近|国家|省级|市级|福建|广东|浙江|寺庙|景区)/.test(stem)) return false;
  return true;
}

function existingKeys() {
  const set = new Set();
  for (const group of [LANDMARKS_EAST, LANDMARKS_CENTRAL, LANDMARKS_WEST]) {
    for (const [pid, list] of Object.entries(group)) {
      for (const s of list) set.add(`${pid}/${s.cityId}/${nameKey(s.name)}`);
    }
  }
  return set;
}

async function bingSuggest(query) {
  const url = `https://api.bing.com/qsonhs.aspx?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN' } });
  if (!res.ok) throw new Error(`suggest ${res.status}`);
  const data = await res.json();
  const out = [];
  for (const block of data?.AS?.Results || []) {
    for (const s of block.Suggests || []) {
      if (s.Txt) out.push(String(s.Txt));
    }
  }
  return out;
}

function suggestToName(txt, cityName, provinceName) {
  const raw = String(txt || '').trim();
  if (!raw) return '';
  const startsWithCity = raw.startsWith(cityName) || raw.startsWith(`${cityName}市`);
  if (!startsWithCity) return '';

  const t = raw
    .replace(/(图片|地图|介绍|门票|攻略|旅游|一日游|怎么去|开放时间|地址|附近酒店|天气|美食)$/g, '')
    .replace(new RegExp(`^${cityName}市?`), '')
    .replace(new RegExp(`^${provinceName}省?`), '')
    .replace(/^(的|之)/, '')
    .replace(/^寺庙/, '')
    .trim();
  return isCleanAttractionName(t) ? t : '';
}

async function fetchCity(meta) {
  const cachePath = path.join(cacheDir, `${meta.provinceId}-${meta.cityId}.json`);
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const seeds = [
    `${meta.cityName}景点`,
    `${meta.cityName}景区`,
    `${meta.cityName}必去`,
    `${meta.cityName}旅游`,
    `${meta.cityName}公园`,
    `${meta.cityName}博物馆`,
    `${meta.cityName}古镇`,
    `${meta.cityName}寺`,
    `${meta.cityName}山`,
    `${meta.cityName}湖`,
    `${meta.cityName}岛`,
  ];

  const names = new Set();
  for (const q of seeds) {
    try {
      const suggests = await bingSuggest(q);
      for (const s of suggests) {
        const name = suggestToName(s, meta.cityName, meta.provinceName);
        if (name) names.add(name);
      }
      for (const s of suggests.slice(0, 6)) {
        const base = String(s).replace(/(图片|地图|介绍|门票|攻略)$/g, '').trim();
        if (base.length < 3) continue;
        const deeper = await bingSuggest(base);
        for (const d of deeper) {
          const name = suggestToName(d, meta.cityName, meta.provinceName);
          if (name) names.add(name);
        }
        await sleep(120);
      }
      await sleep(180);
    } catch {
      // ignore
    }
  }

  const verified = [];
  for (const name of names) {
    try {
      const check = await bingSuggest(`${meta.cityName}${name}`);
      const ok = check.some((s) => {
        const n = suggestToName(s, meta.cityName, meta.provinceName);
        return n && nameKey(n) === nameKey(name);
      });
      await sleep(100);
      if (!ok) continue;
      verified.push(name);
    } catch {
      // skip
    }
  }

  const spots = verified.map((name) => ({
    cityId: meta.cityId,
    cityName: meta.cityName,
    name,
    category: guessCategory(name),
    area: meta.cityName,
    location: buildLocation(meta.provinceName, meta.cityName, meta.cityName),
    source: 'bing-suggest',
  }));

  const payload = { fetchedAt: new Date().toISOString(), spots };
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function writeOutputs(provinces) {
  const payload = { generatedAt: new Date().toISOString(), provinces };
  fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');
  const ids = Object.keys(provinces).sort();
  let body = '/** Auto-generated real landmarks (5A + Bing suggest). */\n\n';
  body += 'export const LANDMARKS_EXTRA = {\n';
  for (const pid of ids) {
    body += `  ${pid}: [\n`;
    for (const s of provinces[pid] || []) {
      const fields = [
        `cityId: ${JSON.stringify(s.cityId)}`,
        `cityName: ${JSON.stringify(s.cityName)}`,
        `name: ${JSON.stringify(s.name)}`,
        `category: ${JSON.stringify(s.category)}`,
        `area: ${JSON.stringify(s.area)}`,
        `location: ${JSON.stringify(s.location)}`,
      ];
      if (typeof s.lat === 'number') fields.push(`lat: ${s.lat}`);
      if (typeof s.lng === 'number') fields.push(`lng: ${s.lng}`);
      if (s.source) fields.push(`source: ${JSON.stringify(s.source)}`);
      if (s.grade) fields.push(`grade: ${JSON.stringify(s.grade)}`);
      body += `    { ${fields.join(', ')} },\n`;
    }
    body += '  ],\n';
  }
  body += '};\n';
  fs.writeFileSync(outMjs, body, 'utf8');
}

async function main() {
  const keys = existingKeys();
  const provinces = {};
  if (fs.existsSync(outJson)) {
    const prev = JSON.parse(fs.readFileSync(outJson, 'utf8'));
    for (const [pid, list] of Object.entries(prev.provinces || {})) {
      // 丢掉脏抽取；并复核联想结果质量
      provinces[pid] = (list || []).filter((s) => {
        if (s.source === 'bing') return false;
        if (s.source === 'bing-suggest' && !isCleanAttractionName(s.name)) return false;
        return true;
      });
      for (const s of provinces[pid]) keys.add(`${pid}/${s.cityId}/${nameKey(s.name)}`);
    }
  }

  for (const province of geo.provinces || []) {
    if (ONLY_PROVINCE && province.id !== ONLY_PROVINCE) continue;
    for (const city of province.cities || []) {
      if (ONLY_CITY && city.id !== ONLY_CITY) continue;
      if (FORCE) {
        provinces[province.id] = (provinces[province.id] || []).filter((s) => {
          if (s.cityId !== city.id) return true;
          if (s.source === 'bing-suggest') {
            keys.delete(`${province.id}/${s.cityId}/${nameKey(s.name)}`);
            return false;
          }
          return true;
        });
      }
      const meta = {
        provinceId: province.id,
        provinceName: PROVINCE_NAMES[province.id] || province.name,
        cityId: city.id,
        cityName: city.name,
      };
      process.stdout.write(`suggest ${meta.provinceId}/${meta.cityId} ${meta.cityName} ... `);
      try {
        const { spots } = await fetchCity(meta);
        let added = 0;
        if (!provinces[province.id]) provinces[province.id] = [];
        for (const s of spots) {
          const key = `${province.id}/${s.cityId}/${nameKey(s.name)}`;
          if (keys.has(key)) continue;
          provinces[province.id].push(s);
          keys.add(key);
          added += 1;
        }
        console.log(`+${added}`);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
      writeOutputs(provinces);
      await sleep(200);
    }
  }

  writeOutputs(provinces);
  let total = 0;
  for (const list of Object.values(provinces)) total += list.length;
  console.log(`done extra=${total} -> ${outMjs}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
