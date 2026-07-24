/**
 * 用必应检索抽取各城市真实景点名（本机可访问 Bing，Wikidata/OSM 不可用）。
 * 候选需二次校验：搜索「景点名 + 城市 + 景点」有结果才入库。
 *
 *   node scripts/spot-seeds/fetch-bing-landmarks.mjs
 *   node scripts/spot-seeds/fetch-bing-landmarks.mjs --city=xiamen --force
 *   node scripts/spot-seeds/fetch-bing-landmarks.mjs --province=fujian
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geo from '../../src/data/travelGeo.generated.json' with { type: 'json' };
import { LANDMARKS_EAST } from './landmarks-east.mjs';
import { LANDMARKS_CENTRAL } from './landmarks-central.mjs';
import { LANDMARKS_WEST } from './landmarks-west.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'landmarks-bing.json');
const cacheDir = path.join(__dirname, '.bing-cache');
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
const VALIDATE = args.validate !== '0';

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

const STOP_NAMES = new Set([
  '首页', '百科', '地图', '门票', '攻略', '旅游', '景点', '推荐', '排名', '必去',
  '一日游', '两日游', '三日游', '自由行', '跟团', '酒店', '美食', '天气', '交通',
  '附近', '人气', '热门', '好玩', '打卡', '网红', '周末', '暑假', '春节', '国庆',
  '中国', '国内', '世界', '亚洲', '省份', '城市', '市区', '城区', '县城',
]);

const FAKE_RE = /(社区公园|文化驿站|观景节点|城市公园\d|步行街区|网红打卡墙|欢乐谷风格|流动博物馆|临时展览|城市中心步行区|特色商业街区|近郊观景点|文化古迹点|水岸步道|本地寺庙)/;

const SUFFIX_HINT = /(公园|景区|风景区|风景名胜区|博物院|博物馆|纪念馆|美术馆|科技馆|寺|庙|祠|塔|宫|苑|园|山|峰|湖|江|河|海|湾|岛|屿|岩|洞|窟|峡|瀑布|古城|古镇|老街|步行街|广场|码头|沙滩|海滩|炮台|长城|陵|墓|故居|遗址|湿地|森林公园|植物园|动物园|乐园|水上乐园|影视城|大学|书院)/;

fs.mkdirSync(cacheDir, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
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

function extractCandidates(html, cityName, provinceName) {
  const text = decodeHtml(html);
  const found = new Map(); // name -> score

  const patterns = [
    /([一-龥]{2,16}(?:风景名胜区|风景区|森林公园|湿地公园|地质公园|植物园|动物园|博物馆|博物院|纪念馆|美术馆|科技馆|游乐园|主题乐园|水上乐园|影视城|古城|古镇|老街|步行街|沙滩|海滩|炮台|故居|遗址|书院))/g,
    /([一-龥]{2,12}(?:公园|景区|寺|庙|祠|塔|宫|苑|园|山|峰|湖|岛|屿|岩|洞|窟|峡|陵))/g,
  ];

  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const name = cleanName(m[1], cityName, provinceName);
      if (!name) continue;
      found.set(name, (found.get(name) || 0) + 1);
    }
  }

  // 标题里常见「1.鼓浪屿 2.南普陀」
  for (const m of text.matchAll(/(?:^|[^\d])([1-9]\d?)[\.、．]\s*([一-龥]{2,16})/g)) {
    const name = cleanName(m[2], cityName, provinceName);
    if (!name) continue;
    found.set(name, (found.get(name) || 0) + 3);
  }

  return [...found.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh'));
}

function cleanName(raw, cityName, provinceName) {
  let name = String(raw || '').trim();
  name = name.replace(/^(热门|必去|推荐|著名|人气|网红|本地|周边)/, '');
  name = name.replace(/(门票|开放时间|怎么去|攻略|一日游|旅游|景点|介绍|地址|电话)$/g, '');
  name = name.replace(new RegExp(`^(${cityName}|${provinceName})`), '');
  name = name.trim();
  if (name.length < 2 || name.length > 18) return '';
  if (STOP_NAMES.has(name)) return '';
  if (FAKE_RE.test(name)) return '';
  if (!SUFFIX_HINT.test(name) && name.length < 3) return '';
  // 过泛
  if (/^(公园|景区|博物馆|寺庙|古城|古镇|沙滩|海滩|动物园|植物园)$/.test(name)) return '';
  if (!/[\u4e00-\u9fff]/.test(name)) return '';
  return name;
}

function guessCategory(name) {
  if (/博物|美术|科技|纪念馆|展览/.test(name)) return '博物馆';
  if (/乐园|动物园|水族|方特|欢乐谷|迪士尼/.test(name)) return '主题乐园';
  if (/寺|庙|祠|教堂|清真寺|道观/.test(name)) return '宗教寺庙';
  if (/古镇|老街|步行街|古城|牌坊/.test(name)) return '古镇街区';
  if (/沙滩|海滩|湖|湾|岛|屿|湿地|码头|海滨/.test(name)) return '海滨湖泊';
  if (/山|峰|峡|岩|洞|窟|瀑布|峡谷/.test(name)) return '山地峡谷';
  if (/公园|植物园|园林|花园|广场/.test(name)) return '公园休闲';
  if (/街|市场|夜市|美食/.test(name)) return '美食购物';
  return '历史人文';
}

function guessArea(name, cityName, snippet) {
  const m = String(snippet || '').match(new RegExp(`${cityName}([\u4e00-\u9fff]{2,4}[区县])`));
  if (m) return m[1];
  const m2 = String(snippet || '').match(/([\u4e00-\u9fff]{2,4}[区县])/);
  if (m2 && !m2[1].includes('景区')) return m2[1];
  // 常见片区词
  if (/鼓浪屿/.test(name) || /鼓浪屿/.test(snippet || '')) return '鼓浪屿';
  return cityName;
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
  const city = /[市区县]$/.test(cityName) ? cityName : `${cityName}市`;
  const areaPart = area && area !== cityName && area !== city ? area : '';
  return [provinceLabel(provinceName), city, areaPart].filter(Boolean).join('');
}

async function validateSpot(name, cityName, provinceName) {
  const html = await bingSearch(`${name} ${cityName} ${provinceName} 景点`);
  const text = decodeHtml(html);
  const hit = text.includes(name) && (text.includes(cityName) || text.includes(provinceName));
  const tourist = /景点|景区|旅游|参观|门票|开放/.test(text);
  // 排除明显“找不到/百科无结果”类
  const weak = /找不到与您的搜索相关|没有找到|暂无数据/.test(text);
  return hit && tourist && !weak;
}

function existingNames() {
  const set = new Set();
  for (const group of [LANDMARKS_EAST, LANDMARKS_CENTRAL, LANDMARKS_WEST]) {
    for (const [pid, list] of Object.entries(group)) {
      for (const s of list) {
        set.add(`${pid}/${s.cityId}/${String(s.name).replace(/\s+/g, '')}`);
      }
    }
  }
  return set;
}

async function fetchCity(meta, existing) {
  const cachePath = path.join(cacheDir, `${meta.provinceId}-${meta.cityId}.json`);
  if (!FORCE && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const queries = [
    `${meta.cityName}必去景点`,
    `${meta.cityName}著名旅游景点`,
    `${meta.cityName}热门景区 名单`,
    `${meta.provinceName}${meta.cityName}景点推荐`,
  ];

  const scored = new Map();
  let joinedHtml = '';
  for (const q of queries) {
    try {
      const html = await bingSearch(q);
      joinedHtml += `\n${html}`;
      for (const item of extractCandidates(html, meta.cityName, meta.provinceName)) {
        scored.set(item.name, (scored.get(item.name) || 0) + item.score);
      }
      await sleep(350 + Math.random() * 350);
    } catch {
      // ignore one query failure
    }
  }

  const ranked = [...scored.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);

  const spots = [];
  for (const item of ranked) {
    const key = `${meta.provinceId}/${meta.cityId}/${item.name.replace(/\s+/g, '')}`;
    if (existing.has(key)) continue;
    if (VALIDATE) {
      try {
        const ok = await validateSpot(item.name, meta.cityName, meta.provinceName);
        await sleep(280 + Math.random() * 320);
        if (!ok) continue;
      } catch {
        continue;
      }
    }
    const area = guessArea(item.name, meta.cityName, joinedHtml);
    spots.push({
      cityId: meta.cityId,
      cityName: meta.cityName,
      name: item.name,
      category: guessCategory(item.name),
      area,
      location: buildLocation(meta.provinceName, meta.cityName, area),
      source: 'bing',
      score: item.score,
    });
  }

  const payload = { fetchedAt: new Date().toISOString(), spots };
  fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

async function main() {
  const existing = existingNames();
  const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : { provinces: {} };
  const provinces = { ...(prev.provinces || {}) };
  let cityCount = 0;
  let added = 0;

  for (const province of geo.provinces || []) {
    if (ONLY_PROVINCE && province.id !== ONLY_PROVINCE) continue;
    if (!provinces[province.id]) provinces[province.id] = [];
    if (FORCE && !ONLY_CITY) provinces[province.id] = [];

    for (const city of province.cities || []) {
      if (ONLY_CITY && city.id !== ONLY_CITY) continue;
      if (FORCE && ONLY_CITY) {
        provinces[province.id] = (provinces[province.id] || []).filter((s) => s.cityId !== city.id);
      }
      cityCount += 1;
      const meta = {
        provinceId: province.id,
        provinceName: PROVINCE_NAMES[province.id] || province.name,
        cityId: city.id,
        cityName: city.name,
      };
      process.stdout.write(`bing ${meta.provinceId}/${meta.cityId} ${meta.cityName} ... `);
      try {
        const { spots } = await fetchCity(meta, existing);
        provinces[province.id] = [
          ...(provinces[province.id] || []).filter((s) => s.cityId !== city.id),
          ...spots.map(({ score, ...rest }) => rest),
        ];
        added += spots.length;
        console.log(`+${spots.length}`);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
      if (cityCount % 2 === 0) {
        fs.writeFileSync(
          outPath,
          JSON.stringify({ generatedAt: new Date().toISOString(), provinces }, null, 2),
          'utf8'
        );
      }
      await sleep(500 + Math.random() * 500);
    }
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), provinces }, null, 2),
    'utf8'
  );
  let total = 0;
  for (const list of Object.values(provinces)) total += list.length;
  console.log(`done cities=${cityCount} bingSpots=${total} addedThisRun≈${added} -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
