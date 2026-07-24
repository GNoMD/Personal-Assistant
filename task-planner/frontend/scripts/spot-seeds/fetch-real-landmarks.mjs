/**
 * 拉取真实景点并生成 landmarks-extra.mjs：
 * 1) 文旅部官网 5A 名录（权威）
 * 2) 必应检索各市景点（强制景区后缀 + 二次校验，拒绝句子碎片）
 *
 *   node scripts/spot-seeds/fetch-real-landmarks.mjs
 *   node scripts/spot-seeds/fetch-real-landmarks.mjs --city=xiamen --force
 *   node scripts/spot-seeds/fetch-real-landmarks.mjs --skip-bing
 *   node scripts/spot-seeds/fetch-real-landmarks.mjs --province=fujian
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
const cacheDir = path.join(__dirname, '.real-cache');
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
const SKIP_BING = Boolean(args['skip-bing']);
const SKIP_5A = Boolean(args['skip-5a']);

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

const PROVINCE_ALIASES = {
  北京市: 'beijing', 天津: 'tianjin', 天津市: 'tianjin', 上海: 'shanghai', 上海市: 'shanghai',
  重庆: 'chongqing', 重庆市: 'chongqing',
  河北: 'hebei', 河北省: 'hebei', 山西: 'shanxi', 山西省: 'shanxi',
  辽宁: 'liaoning', 辽宁省: 'liaoning', 吉林: 'jilin', 吉林省: 'jilin',
  黑龙江: 'heilongjiang', 黑龙江省: 'heilongjiang',
  江苏: 'jiangsu', 江苏省: 'jiangsu', 浙江: 'zhejiang', 浙江省: 'zhejiang',
  安徽: 'anhui', 安徽省: 'anhui', 福建: 'fujian', 福建省: 'fujian',
  江西: 'jiangxi', 江西省: 'jiangxi', 山东: 'shandong', 山东省: 'shandong',
  河南: 'henan', 河南省: 'henan', 湖北: 'hubei', 湖北省: 'hubei',
  湖南: 'hunan', 湖南省: 'hunan', 广东: 'guangdong', 广东省: 'guangdong',
  海南: 'hainan', 海南省: 'hainan', 四川: 'sichuan', 四川省: 'sichuan',
  贵州: 'guizhou', 贵州省: 'guizhou', 云南: 'yunnan', 云南省: 'yunnan',
  陕西: 'shaanxi', 陕西省: 'shaanxi', 甘肃: 'gansu', 甘肃省: 'gansu',
  青海: 'qinghai', 青海省: 'qinghai', 台湾: 'taiwan',
  内蒙古: 'neimenggu', 内蒙古自治区: 'neimenggu',
  广西: 'guangxi', 广西壮族自治区: 'guangxi',
  西藏: 'xizang', 西藏自治区: 'xizang',
  宁夏: 'ningxia', 宁夏回族自治区: 'ningxia',
  新疆: 'xinjiang', 新疆维吾尔自治区: 'xinjiang',
};

const ATTR_SUFFIX = /(风景名胜区|风景区|旅游区|旅游景区|文化旅游区|度假区|森林公园|湿地公园|地质公园|海洋公园|主题乐园|游乐园|水上乐园|动物园|植物园|博物院|博物馆|纪念馆|美术馆|科技馆|故居|遗址|古城|古镇|老街|步行街|炮台|沙滩|海滩|广场|公园|景区|寺|庙|祠|塔|宫|苑|园|山|峰|湖|江|河|海|湾|岛|屿|岩|洞|窟|峡|瀑布|陵|墓|桥|关|城墙|书院|学村|影视城)$/;

fs.mkdirSync(cacheDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeName(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/(国家)?[345]A级?/, '')
    .replace(/(旅游景区|风景名胜区|风景区|旅游区)$/g, (m, _a, offset, s) => {
      // keep shorter display names but normalize key without trailing type sometimes
      return m;
    })
    .trim();
}

function nameKey(name) {
  return normalizeName(name)
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

function buildLocation(provinceName, cityName, area, address) {
  if (address && String(address).trim()) return String(address).trim();
  const city = /[市区县州盟旗]$/.test(cityName) ? cityName : `${cityName}市`;
  const areaPart = area && area !== cityName && area !== city ? area : '';
  return [provinceLabel(provinceName), city, areaPart].filter(Boolean).join('');
}

function guessCategory(name) {
  if (/博物|美术|科技|纪念馆|展览/.test(name)) return '博物馆';
  if (/乐园|动物园|水族|方特|欢乐谷|迪士尼|海洋公园/.test(name)) return '主题乐园';
  if (/寺|庙|祠|教堂|清真寺|道观/.test(name)) return '宗教寺庙';
  if (/古镇|老街|步行街|古城|牌坊/.test(name)) return '古镇街区';
  if (/沙滩|海滩|湖|湾|岛|屿|湿地|码头|海滨|江|河/.test(name)) return '海滨湖泊';
  if (/山|峰|峡|岩|洞|窟|瀑布|峡谷|关/.test(name)) return '山地峡谷';
  if (/公园|植物园|园林|花园|广场/.test(name)) return '公园休闲';
  if (/街|市场|夜市|美食/.test(name)) return '美食购物';
  return '历史人文';
}

function isCleanAttractionName(name) {
  const n = String(name || '').trim();
  if (n.length < 2 || n.length > 22) return false;
  if (!ATTR_SUFFIX.test(n)) return false;
  if (/^(原名|位于|地处|别称|命名|一座|我超|充满|综合|热门|推荐|必去|十大|盘点|著名|人气|当地|附近)/.test(n)) return false;
  if (/(著名景区|热门景区|4A景区|5A景区|必去景点|旅游景点|地形多山)/.test(n)) return false;
  if (/[的是与和在为了从到但如何占]{2,}/.test(n)) return false;
  if (/^[A-Za-z0-9\s\-_.]+$/.test(n)) return false;
  if (/^(公园|景区|博物馆|寺庙|古城|古镇|沙滩|海滩|动物园|植物园|山|湖|岛|苑|园|寺|庙)$/.test(n)) return false;
  // 名称主体不能全是虚词/形容词
  const stem = n.replace(ATTR_SUFFIX, '');
  if (stem.length < 2) return false;
  if (/^(著名|热门|必去|推荐|当地|附近|国家|省级|市级)$/.test(stem)) return false;
  return /[\u4e00-\u9fff]/.test(n);
}

function shortenDisplayName(name) {
  return String(name || '')
    .replace(/^中国/, '')
    .replace(/(国家)?[345]A级?/, '')
    .replace(/省|市/g, (ch, idx, s) => {
      // don't strip mid-name 市 as in 城市
      return ch;
    })
    .trim();
}

function buildCityIndex() {
  /** @type {Map<string, {provinceId:string,cityId:string,cityName:string,provinceName:string}[]>} */
  const byCityName = new Map();
  for (const p of geo.provinces || []) {
    for (const c of p.cities || []) {
      const variants = new Set([
        c.name,
        `${c.name}市`,
        c.name.replace(/市$/, ''),
        `${c.name}区`,
      ]);
      for (const v of variants) {
        if (!byCityName.has(v)) byCityName.set(v, []);
        byCityName.get(v).push({
          provinceId: p.id,
          cityId: c.id,
          cityName: c.name,
          provinceName: PROVINCE_NAMES[p.id] || p.name,
        });
      }
    }
  }
  return byCityName;
}

function matchCity(cityNameRaw, provinceNameRaw, cityIndex) {
  const provinceId = PROVINCE_ALIASES[String(provinceNameRaw || '').trim()]
    || PROVINCE_ALIASES[String(provinceNameRaw || '').replace(/(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区)$/g, '')];
  const raw = String(cityNameRaw || '').trim();
  const candidates = cityIndex.get(raw)
    || cityIndex.get(raw.replace(/市$/, ''))
    || cityIndex.get(`${raw}市`)
    || [];
  if (provinceId) {
    const hit = candidates.find((c) => c.provinceId === provinceId);
    if (hit) return hit;
  }
  if (candidates.length === 1) return candidates[0];

  // 直辖市：cityName 常为「北京市」等，尽量落到已有区县
  if (provinceId && ['beijing', 'tianjin', 'shanghai', 'chongqing'].includes(provinceId)) {
    const cities = (geo.provinces || []).find((p) => p.id === provinceId)?.cities || [];
    // Prefer central districts when unspecified
    const preferred = {
      beijing: ['dongcheng', 'xicheng', 'haidian', 'chaoyang'],
      tianjin: ['heping', 'hexi', 'nankai'],
      shanghai: ['huangpu', 'xuhui', 'pudong'],
      chongqing: ['yuzhong', 'jiangbei', 'nanan'],
    }[provinceId] || [];
    for (const id of preferred) {
      const c = cities.find((x) => x.id === id);
      if (c) {
        return {
          provinceId,
          cityId: c.id,
          cityName: c.name,
          provinceName: PROVINCE_NAMES[provinceId],
        };
      }
    }
    if (cities[0]) {
      return {
        provinceId,
        cityId: cities[0].id,
        cityName: cities[0].name,
        provinceName: PROVINCE_NAMES[provinceId],
      };
    }
  }
  return null;
}

function existingSpotKeys() {
  const set = new Set();
  for (const group of [LANDMARKS_EAST, LANDMARKS_CENTRAL, LANDMARKS_WEST]) {
    for (const [pid, list] of Object.entries(group)) {
      for (const s of list) {
        set.add(`${pid}/${s.cityId}/${nameKey(s.name)}`);
      }
    }
  }
  return set;
}

async function fetch5APage(page) {
  const res = await fetch('https://www.mct.gov.cn/tourism/api/content/getContentListByDirId', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://www.mct.gov.cn',
      Referer: 'https://www.mct.gov.cn/tourism/',
      'User-Agent': UA,
    },
    body: JSON.stringify({ directoryId: '4', page, size: 50, searchList: [] }),
  });
  if (!res.ok) throw new Error(`mct ${res.status}`);
  return res.json();
}

async function fetchAll5A() {
  const cachePath = path.join(cacheDir, 'mct-5a.json');
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }
  const all = [];
  let page = 1;
  let last = false;
  while (!last) {
    process.stdout.write(`5A page ${page}... `);
    const data = await fetch5APage(page);
    const block = data?.data?.contentList;
    const content = block?.content || [];
    all.push(...content);
    last = Boolean(block?.last) || content.length === 0;
    console.log(`+${content.length}`);
    page += 1;
    await sleep(800);
    if (page > 40) break;
  }
  fs.writeFileSync(cachePath, JSON.stringify(all, null, 2), 'utf8');
  return all;
}

function findCityInProvince(provinceId, scenicName) {
  const province = (geo.provinces || []).find((p) => p.id === provinceId);
  if (!province) return null;
  const name = String(scenicName || '');
  // longer names first: 连云港 before 连云
  const cities = [...(province.cities || [])].sort((a, b) => b.name.length - a.name.length);
  for (const c of cities) {
    if (name.includes(`${c.name}市`) || name.includes(c.name)) {
      return {
        provinceId,
        cityId: c.id,
        cityName: c.name,
        provinceName: PROVINCE_NAMES[provinceId] || province.name,
      };
    }
  }
  return null;
}

function map5AToSpots(rows, cityIndex) {
  const out = [];
  for (const row of rows) {
    let provinceName = String(row.provinceName || '').trim();
    // 跨省条目取第一个省
    if (provinceName.includes('、')) provinceName = provinceName.split('、')[0].trim();
    if (provinceName.includes('生产建设兵团')) provinceName = '新疆维吾尔自治区';

    const provinceId = PROVINCE_ALIASES[provinceName]
      || PROVINCE_ALIASES[provinceName.replace(/(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区)$/g, '')];
    if (!provinceId) continue;

    let matched = null;
    if (row.cityName) matched = matchCity(row.cityName, provinceName, cityIndex);
    if (!matched) matched = findCityInProvince(provinceId, row.name);
    if (!matched) matched = matchCity(provinceName, provinceName, cityIndex);
    if (!matched) continue;

    if (ONLY_PROVINCE && matched.provinceId !== ONLY_PROVINCE) continue;
    if (ONLY_CITY && matched.cityId !== ONLY_CITY) continue;

    let name = String(row.name || '').trim();
    // 去掉「厦门市」「福建省」一类前缀
    name = name.replace(new RegExp(`^${matched.provinceName}省?`), '');
    name = name.replace(new RegExp(`^${matched.cityName}市?`), '');
    name = name.replace(/^市/, '');
    name = name.replace(/^[（(【\[]+/, '').replace(/[）)】\]]+(?=旅游|风景|景区|公园)/g, '');
    name = name.replace(/[（(]([^）)]+)[）)]/g, '$1');
    name = name.replace(/[•·]/g, '');
    name = name.trim();
    if (!name) name = String(row.name || '').trim();

    let lat;
    let lng;
    if (typeof row.location === 'string' && row.location.includes(',')) {
      const [a, b] = row.location.split(',').map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        lng = a;
        lat = b;
      }
    }

    const area = matched.cityName;
    out.push({
      cityId: matched.cityId,
      cityName: matched.cityName,
      name,
      category: guessCategory(name),
      area,
      location: buildLocation(matched.provinceName, matched.cityName, area),
      lat,
      lng,
      source: 'mct-5a',
      grade: row.gradesName || '5A',
      provinceId: matched.provinceId,
    });
  }
  return out;
}

async function bingSearch(query) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-CN&cc=CN`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'zh-CN,zh;q=0.9',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`bing ${res.status}`);
  return res.text();
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBingNames(html, cityName) {
  const text = decodeHtml(html);
  const found = new Map();
  const re = /([一-龥A-Za-z0-9·]{2,18}(?:风景名胜区|风景区|森林公园|湿地公园|地质公园|海洋公园|主题乐园|游乐园|动物园|植物园|博物院|博物馆|纪念馆|美术馆|科技馆|故居|遗址|古城|古镇|老街|步行街|炮台|沙滩|海滩|公园|景区|寺|庙|塔|宫|苑|山|峰|湖|岛|屿|岩|洞|窟|峡|瀑布|陵|关|书院|学村|影视城))/g;
  for (const m of text.matchAll(re)) {
    let name = m[1].trim();
    name = name.replace(new RegExp(`^(${cityName}|中国)`), '');
    name = name.replace(/(门票|攻略|介绍|怎么去|开放时间|旅游)$/g, '');
    if (!isCleanAttractionName(name)) continue;
    found.set(name, (found.get(name) || 0) + 1);
  }
  return [...found.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);
}

async function validateBingName(name, cityName, provinceName) {
  const html = await bingSearch(`"${name}" ${cityName}`);
  const text = decodeHtml(html);
  if (!text.includes(name)) return false;
  if (!(text.includes(cityName) || text.includes(provinceName))) return false;
  if (!/(景区|景点|公园|博物馆|风景|旅游|门票|开放|参观)/.test(text)) return false;
  // 若明确写在别的省/市且与当前市无关，丢掉
  const wrong = new RegExp(`位于(?!${cityName})([一-龥]{2,8}(?:市|县))`);
  // soft check only
  return true;
}

async function fetchBingForCity(meta, existingKeys, homeOfFamous) {
  const cachePath = path.join(cacheDir, `bing-${meta.provinceId}-${meta.cityId}.json`);
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }
  const queries = [
    `${meta.cityName}必去景点`,
    `${meta.cityName}著名景区`,
    `${meta.cityName}4A景区`,
    `${meta.provinceName}${meta.cityName}旅游景点推荐`,
  ];
  const scored = new Map();
  for (const q of queries) {
    try {
      const html = await bingSearch(q);
      for (const item of extractBingNames(html, meta.cityName)) {
        scored.set(item.name, (scored.get(item.name) || 0) + item.score);
      }
      await sleep(300 + Math.random() * 300);
    } catch {
      // ignore
    }
  }

  const ranked = [...scored.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);

  const spots = [];
  for (const item of ranked) {
    const key = `${meta.provinceId}/${meta.cityId}/${nameKey(item.name)}`;
    if (existingKeys.has(key)) continue;
    const famousHome = homeOfFamous.get(nameKey(item.name));
    if (famousHome && famousHome !== `${meta.provinceId}/${meta.cityId}`) continue;
    try {
      const ok = await validateBingName(item.name, meta.cityName, meta.provinceName);
      await sleep(250 + Math.random() * 250);
      if (!ok) continue;
    } catch {
      continue;
    }
    spots.push({
      cityId: meta.cityId,
      cityName: meta.cityName,
      name: item.name,
      category: guessCategory(item.name),
      area: meta.cityName,
      location: buildLocation(meta.provinceName, meta.cityName, meta.cityName),
      source: 'bing',
      provinceId: meta.provinceId,
    });
  }
  const payload = { fetchedAt: new Date().toISOString(), spots };
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function writeOutputs(provinces) {
  const payload = { generatedAt: new Date().toISOString(), provinces };
  fs.writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');

  const ids = Object.keys(provinces).sort();
  let body = '/** Auto-generated real landmarks (5A + verified Bing). Do not hand-edit. */\n\n';
  body += 'export const LANDMARKS_EXTRA = {\n';
  for (const pid of ids) {
    body += `  ${pid}: [\n`;
    for (const s of provinces[pid]) {
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
  const cityIndex = buildCityIndex();
  const existingKeys = existingSpotKeys();
  /** famous nameKey -> provinceId/cityId from curated + 5A */
  const homeOfFamous = new Map();
  for (const key of existingKeys) {
    const [pid, cid, nk] = key.split('/');
    if (!homeOfFamous.has(nk)) homeOfFamous.set(nk, `${pid}/${cid}`);
  }

  /** @type {Record<string, any[]>} */
  const provinces = {};
  const fullForce = FORCE && !ONLY_PROVINCE && !ONLY_CITY;
  // 载入已有 extra（全量 --force 时不载入，避免“已存在”误跳过）
  if (!fullForce && fs.existsSync(outJson)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outJson, 'utf8'));
      for (const [pid, list] of Object.entries(prev.provinces || {})) {
        provinces[pid] = [...(list || [])];
        for (const s of list || []) {
          const key = `${pid}/${s.cityId}/${nameKey(s.name)}`;
          existingKeys.add(key);
          homeOfFamous.set(nameKey(s.name), `${pid}/${s.cityId}`);
        }
      }
    } catch {
      // ignore broken cache
    }
  }

  if (FORCE && ONLY_CITY) {
    for (const pid of Object.keys(provinces)) {
      provinces[pid] = (provinces[pid] || []).filter((s) => {
        if (s.cityId !== ONLY_CITY) return true;
        existingKeys.delete(`${pid}/${s.cityId}/${nameKey(s.name)}`);
        return false;
      });
    }
  }
  if (FORCE && ONLY_PROVINCE && !ONLY_CITY) {
    for (const s of provinces[ONLY_PROVINCE] || []) {
      existingKeys.delete(`${ONLY_PROVINCE}/${s.cityId}/${nameKey(s.name)}`);
    }
    provinces[ONLY_PROVINCE] = [];
  }
  if (fullForce) {
    for (const pid of Object.keys(provinces)) provinces[pid] = [];
  }

  const addSpot = (spot) => {
    const pid = spot.provinceId;
    if (!pid) return false;
    if (ONLY_PROVINCE && pid !== ONLY_PROVINCE) return false;
    if (ONLY_CITY && spot.cityId !== ONLY_CITY) return false;
    if (!isCleanAttractionName(spot.name) && spot.source !== 'mct-5a') return false;
    const key = `${pid}/${spot.cityId}/${nameKey(spot.name)}`;
    if (existingKeys.has(key)) return false;
    if (!provinces[pid]) provinces[pid] = [];
    if (provinces[pid].some((s) => nameKey(s.name) === nameKey(spot.name) && s.cityId === spot.cityId)) {
      return false;
    }
    const { provinceId, ...rest } = spot;
    provinces[pid].push(rest);
    existingKeys.add(key);
    homeOfFamous.set(nameKey(spot.name), `${pid}/${spot.cityId}`);
    return true;
  };

  if (!SKIP_5A) {
    console.log('Fetching MCT 5A list...');
    const rows = await fetchAll5A();
    const mapped = map5AToSpots(rows, cityIndex);
    let n = 0;
    for (const s of mapped) if (addSpot(s)) n += 1;
    console.log(`5A mapped=${mapped.length} added=${n}`);
  }

  if (!SKIP_BING) {
    for (const province of geo.provinces || []) {
      if (ONLY_PROVINCE && province.id !== ONLY_PROVINCE) continue;
      for (const city of province.cities || []) {
        if (ONLY_CITY && city.id !== ONLY_CITY) continue;
        const meta = {
          provinceId: province.id,
          provinceName: PROVINCE_NAMES[province.id] || province.name,
          cityId: city.id,
          cityName: city.name,
        };
        process.stdout.write(`bing ${meta.provinceId}/${meta.cityId} ${meta.cityName} ... `);
        try {
          const { spots } = await fetchBingForCity(meta, existingKeys, homeOfFamous);
          let added = 0;
          for (const s of spots) {
            if (addSpot({ ...s, provinceId: meta.provinceId })) added += 1;
          }
          console.log(`+${added}`);
        } catch (err) {
          console.log(`FAIL ${err.message}`);
        }
        writeOutputs(provinces);
        await sleep(400 + Math.random() * 400);
      }
    }
  }

  writeOutputs(provinces);
  let total = 0;
  for (const list of Object.values(provinces)) total += list.length;
  console.log(`done extraSpots=${total} -> ${outMjs}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
