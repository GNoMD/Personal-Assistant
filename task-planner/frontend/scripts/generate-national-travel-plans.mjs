/**
 * 全国每市六类行程各 8 条
 * 用法（frontend 目录）: node scripts/generate-national-travel-plans.mjs
 *
 * 输出: src/data/travelPlansGenerated.js
 * 结构: { [provinceId]: { [cityId]: { half|1day|2day|3day|4day|5day: Plan[] } } }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import geo from '../src/data/travelGeo.generated.js';
import rich from '../src/data/travelSpotsRich.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'src/data/travelPlansGenerated.js');

const DURATIONS = [
  { id: 'half', days: 0, label: '半日游', spotCount: [2, 3] },
  { id: '1day', days: 1, label: '一日游', spotCount: [4, 5] },
  { id: '2day', days: 2, label: '两日游', perDay: [2, 3] },
  { id: '3day', days: 3, label: '三日游', perDay: [2, 3] },
  { id: '4day', days: 4, label: '四日游', perDay: [2, 3] },
  { id: '5day', days: 5, label: '五日游', perDay: [2, 3] },
];

const VARIANTS = [
  { key: 'classic', theme: '经典必打卡', bestFor: '首次到访 · 精华路线', prefer: ['历史人文', '古镇街区', '宗教寺庙', '博物馆'] },
  { key: 'culture', theme: '人文深度', bestFor: '喜欢博物馆与老城', prefer: ['博物馆', '历史人文', '宗教寺庙'] },
  { key: 'nature', theme: '山水自然', bestFor: '想呼吸新鲜空气', prefer: ['自然风光', '山地峡谷', '海滨湖泊', '公园休闲'] },
  { key: 'night', theme: '夜景休闲', bestFor: '傍晚出行 · 轻松节奏', prefer: ['古镇街区', '美食购物', '公园休闲', '海滨湖泊'] },
  { key: 'family', theme: '亲子友好', bestFor: '带娃出行', prefer: ['主题乐园', '公园休闲', '博物馆', '自然风光'] },
  { key: 'food', theme: '美食漫步', bestFor: '边走边吃', prefer: ['美食购物', '古镇街区', '历史人文'] },
  { key: 'photo', theme: '出片路线', bestFor: '拍照党', prefer: ['自然风光', '古镇街区', '海滨湖泊', '山地峡谷'] },
  { key: 'slow', theme: '慢游城市', bestFor: '不赶场 · 深度逛', prefer: ['公园休闲', '历史人文', '古镇街区', '博物馆'] },
];

const FALLBACK_SPOTS = []; // 已废弃：不再用虚构占位景点凑行程

function scoreSpot(spot, prefer) {
  const idx = prefer.indexOf(spot.category);
  return idx === -1 ? 50 + Math.random() : idx * 10 + Math.random();
}

function toPlanSpot(spot) {
  return {
    name: spot.name,
    area: spot.area || spot.cityName || '',
    duration: spot.duration || (spot.category === '博物馆' ? '1.5–2 小时' : '1–2 小时'),
    tip: spot.tip || spot.summary || `${spot.name}建议预留充足步行与拍照时间。`,
    highlights: (spot.highlights || [spot.category]).slice(0, 4),
  };
}

function pickSpots(pool, prefer, count, offset = 0) {
  const ranked = [...pool].sort((a, b) => scoreSpot(a, prefer) - scoreSpot(b, prefer));
  const rotated = ranked.slice(offset).concat(ranked.slice(0, offset));
  const chosen = [];
  const used = new Set();
  const target = Math.max(1, Math.min(count, pool.length || 1));
  for (const spot of rotated) {
    if (used.has(spot.name)) continue;
    used.add(spot.name);
    chosen.push(spot);
    if (chosen.length >= target) break;
  }
  // 不够也不再用模板假景点凑数
  return chosen.map(toPlanSpot);
}

function dayLabels(n) {
  return Array.from({ length: n }, (_, i) => `第${i + 1}天`);
}

function buildSingleDayPlan({
  provinceId, cityId, cityName, provinceName, durationId, durationLabel, variant, index, spots, crossCity,
}) {
  const id = `${provinceId}-${cityId}-${durationId}-${String(index + 1).padStart(2, '0')}`;
  const names = spots.map((s) => s.name);
  const route = names.join(' → ');
  const title = `${cityName}${durationLabel} · ${variant.theme}`;
  const summary = `围绕${cityName}的「${variant.theme}」节奏安排${durationLabel}，串联 ${names.slice(0, 3).join('、')}${names.length > 3 ? ' 等' : ''}，适合${variant.bestFor}。`;
  const tips = [
    `${provinceName}${cityName}行程仅供参考，开放时间与票务以现场为准。`,
    '热门点建议错峰，住宿尽量选能过夜充电/地铁便利的区域。',
    crossCity ? '部分景点可能需短驳邻市，请预留交通时间。' : '尽量把近点放同一时段，减少折返。',
  ];
  const meals = durationId === 'half'
    ? ['行程前后本地简餐']
    : ['午餐：景区或老街区简餐', '晚餐：本地特色餐厅'];

  return {
    id,
    title,
    theme: variant.theme,
    summary,
    bestFor: variant.bestFor,
    route,
    spots,
    meals,
    tips,
  };
}

function buildMultiDayPlan({
  provinceId, cityId, cityName, provinceName, durationId, durationLabel, variant, index, daySpotGroups, crossCity,
}) {
  const id = `${provinceId}-${cityId}-${durationId}-${String(index + 1).padStart(2, '0')}`;
  const labels = dayLabels(daySpotGroups.length);
  const days = daySpotGroups.map((spots, i) => ({
    label: labels[i],
    theme: `${variant.theme} · ${labels[i]}`,
    spots,
    meals: ['午餐简餐', '晚餐本地菜'],
  }));
  const allNames = daySpotGroups.flat().map((s) => s.name);
  const route = days.map((d) => `${d.label}：${d.spots.map((s) => s.name).join(' → ')}`).join('；');
  return {
    id,
    title: `${cityName}${durationLabel} · ${variant.theme}`,
    theme: variant.theme,
    summary: `${cityName}${durationLabel}以「${variant.theme}」为主线，覆盖 ${allNames.slice(0, 4).join('、')} 等，节奏按日拆分，减少赶场。`,
    bestFor: variant.bestFor,
    route,
    days,
    tips: [
      `建议以${cityName}为住宿基地，减少行李挪动。`,
      '每日出发前确认交通与天气，山区/水边留足返程电量与时间。',
      crossCity ? '跨城景点已穿插在日程中，优先白天往返。' : '同城串联优先，步行与地铁优先于自驾进城。',
      `${provinceName}行程仅供参考，票务与预约以官方为准。`,
    ],
  };
}

function gatherPool(provinceId, cityId, allByCity, provinceCities) {
  const local = allByCity.get(`${provinceId}:${cityId}`) || [];
  if (local.length >= 12) return { pool: local, crossCity: false };
  const neighbors = [];
  for (const c of provinceCities) {
    if (c.id === cityId) continue;
    neighbors.push(...(allByCity.get(`${provinceId}:${c.id}`) || []));
  }
  const pool = [...local, ...neighbors];
  return { pool: pool.length ? pool : local, crossCity: local.length < 8 && neighbors.length > 0 };
}

function generateForCity(province, city, allByCity) {
  const { pool, crossCity } = gatherPool(province.id, city.id, allByCity, province.cities);
  const byDuration = {};

  for (const dur of DURATIONS) {
    const plans = [];
    for (let vi = 0; vi < VARIANTS.length; vi += 1) {
      const variant = VARIANTS[vi];
      if (dur.days <= 1) {
        const need = dur.spotCount[0] + (vi % 2);
        const max = dur.spotCount[1];
        const count = Math.min(max, Math.max(dur.spotCount[0], need));
        const spots = pickSpots(pool, variant.prefer, count, vi * 2);
        plans.push(buildSingleDayPlan({
          provinceId: province.id,
          cityId: city.id,
          cityName: city.name,
          provinceName: province.name,
          durationId: dur.id,
          durationLabel: dur.label,
          variant,
          index: vi,
          spots,
          crossCity,
        }));
      } else {
        const groups = [];
        let cursor = vi * 3;
        for (let d = 0; d < dur.days; d += 1) {
          const n = dur.perDay[0] + ((vi + d) % 2);
          const spots = pickSpots(pool, variant.prefer, n, cursor);
          cursor += n;
          groups.push(spots);
        }
        plans.push(buildMultiDayPlan({
          provinceId: province.id,
          cityId: city.id,
          cityName: city.name,
          provinceName: province.name,
          durationId: dur.id,
          durationLabel: dur.label,
          variant,
          index: vi,
          daySpotGroups: groups,
          crossCity,
        }));
      }
    }
    byDuration[dur.id] = plans;
  }
  return byDuration;
}

function main() {
  /** @type {Map<string, any[]>} */
  const allByCity = new Map();
  for (const spot of rich.spots || []) {
    const key = `${spot.provinceId}:${spot.cityId}`;
    if (!allByCity.has(key)) allByCity.set(key, []);
    allByCity.get(key).push(spot);
  }

  const out = {};
  let cityCount = 0;
  let planCount = 0;

  for (const province of geo.provinces || []) {
    out[province.id] = {};
    for (const city of province.cities || []) {
      const plans = generateForCity(province, city, allByCity);
      out[province.id][city.id] = plans;
      cityCount += 1;
      planCount += Object.values(plans).reduce((n, list) => n + list.length, 0);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    provinceCount: (geo.provinces || []).length,
    cityCount,
    planCount,
    plans: out,
  };

  fs.writeFileSync(
    outPath,
    `/* auto-generated by generate-national-travel-plans.mjs */\nexport default ${JSON.stringify(payload)};\n`,
    'utf8'
  );
  console.log(`wrote ${planCount} plans for ${cityCount} cities -> ${path.relative(root, outPath)}`);
}

main();
