/**
 * 福建旅行计划数据
 * 九市均已提供半日游 / 一日游 / 两日游 / 三日游 / 四日游 / 五日及以上
 * （每种出行天数至少 8 条推荐）
 */

import { OTHER_CITY_PLANS } from './travelOtherCities.js';
import { MORE_CITY_TRAVEL_PLANS } from './travelMorePlans.js';
import { MORE_CITY_TRAVEL_PLANS_REST } from './travelMorePlansRest.js';
import { LONG_CITY_TRAVEL_PLANS } from './travelLongPlans.js';
import { LONG_CITY_TRAVEL_PLANS_REST } from './travelLongPlansRest.js';
import { DRIVE_CITY_TRAVEL_PLANS } from './travelDrivePlans.js';
import travelPlansGenerated from './travelPlansGenerated.js';
import { FUJIAN_PLAN_CITY_PROVINCE, TRAVEL_PROVINCES, getAllCities, getCityInProvince, getProvinceById } from './travelGeo.js';

export const FUJIAN_CITIES = [
  { id: 'xiamen', name: '厦门', pinyin: 'Xiamen' },
  { id: 'fuzhou', name: '福州', pinyin: 'Fuzhou' },
  { id: 'quanzhou', name: '泉州', pinyin: 'Quanzhou' },
  { id: 'zhangzhou', name: '漳州', pinyin: 'Zhangzhou' },
  { id: 'putian', name: '莆田', pinyin: 'Putian' },
  { id: 'sanming', name: '三明', pinyin: 'Sanming' },
  { id: 'nanping', name: '南平', pinyin: 'Nanping' },
  { id: 'longyan', name: '龙岩', pinyin: 'Longyan' },
  { id: 'ningde', name: '宁德', pinyin: 'Ningde' },
];

/** 可选出行时长；半日到五日及以上均已规划 */
export const TRAVEL_DURATIONS = [
  { id: 'half', label: '半日游', hoursHint: '约 4–6 小时', planned: true },
  { id: '1day', label: '一日游', hoursHint: '约 8–10 小时', planned: true },
  { id: '2day', label: '两日游', hoursHint: '含 1 晚住宿', planned: true },
  { id: '3day', label: '三日游', hoursHint: '含 2 晚住宿', planned: true },
  { id: '4day', label: '四日游', hoursHint: '含 3 晚住宿', planned: true },
  { id: '5day', label: '五日及以上', hoursHint: '含 4 晚及以上', planned: true },
];

/**
 * @typedef {{ name: string, area?: string, duration?: string, tip?: string, highlights?: string[] }} Spot
 * @typedef {{ id: string, title: string, theme: string, summary: string, bestFor: string, route: string, spots?: Spot[], meals?: string[], tips?: string[], days?: { label: string, theme: string, spots: Spot[], meals?: string[] }[] }} Plan
 */

function mergeCityPlans(...sources) {
  /** @type {Record<string, Record<string, Plan[]>>} */
  const out = {};
  for (const source of sources) {
    for (const [cityId, byDuration] of Object.entries(source)) {
      if (!out[cityId]) out[cityId] = {};
      for (const [durationId, plans] of Object.entries(byDuration)) {
        out[cityId][durationId] = [...(out[cityId][durationId] || []), ...plans];
      }
    }
  }
  return out;
}

/** @type {Record<string, Record<string, Plan[]>>} */
const CITY_TRAVEL_PLANS_BASE = {
  xiamen: {
    half: [
      {
        id: 'xm-half-gulangyu',
        title: '鼓浪屿精华半日',
        theme: '海岛漫步',
        summary: '轮渡上岛，走完核心街区与海岸线，适合第一次来厦门、时间紧张的半天。',
        bestFor: '首次到访 · 拍照出片',
        route: '轮渡码头 → 鼓浪屿 → 龙头路 → 皓月园/寂庄花园周边 → 返程',
        spots: [
          {
            name: '厦门轮渡码头',
            area: '中山路附近',
            duration: '30 分钟（含候船）',
            tip: '建议提前在官方渠道购票，避开周末早高峰。',
            highlights: ['往返船票', '看鹭江两岸'],
          },
          {
            name: '鼓浪屿龙头路',
            area: '鼓浪屿内',
            duration: '1–1.5 小时',
            tip: '小吃与文创集中，别在一条街吃太饱，留胃给海鲜晚餐。',
            highlights: ['馅饼', '鱼丸', '手作小店'],
          },
          {
            name: '皓月园 / 海岸步道',
            area: '鼓浪屿东南侧',
            duration: '1 小时',
            tip: '郑成功雕像与海边栈道是经典打卡点，下午光线更好。',
            highlights: ['海景', '雕像', '散步'],
          },
          {
            name: '菽庄花园（可选）',
            area: '鼓浪屿内',
            duration: '40–60 分钟',
            tip: '若排队不长可进园；时间紧可只在外围海岸线拍照。',
            highlights: ['海上花园', '钢琴博物馆外景'],
          },
        ],
        meals: ['岛上简餐或龙头路小吃', '返陆后中山路 / 沙坡尾吃正餐'],
        tips: [
          '半日建议只上岛，不硬塞厦大或环岛路。',
          '穿舒适步行鞋，岛上坡道多、电瓶车有限。',
          '台风或大风天可能停航，出发前看轮渡公告。',
        ],
      },
      {
        id: 'xm-half-zhongshan',
        title: '中山路 · 轮渡海景半日',
        theme: '老城漫步',
        summary: '不上岛也能感受厦门：骑楼街、鹭江夜色与周边小吃，适合傍晚出发。',
        bestFor: '傍晚出行 · 少走路强度',
        route: '中山路步行街 → 轮渡海滨 → 开禾路 / 八市方向（可选）→ 结束',
        spots: [
          {
            name: '中山路步行街',
            area: '思明区',
            duration: '1.5–2 小时',
            tip: '保留骑楼风貌，适合慢慢逛；注意人流与随身物品。',
            highlights: ['骑楼建筑', '伴手礼', '咖啡甜品'],
          },
          {
            name: '轮渡海滨广场',
            area: '鹭江道',
            duration: '40 分钟',
            tip: '看对岸鼓浪屿轮廓，日落前后光线最佳。',
            highlights: ['鹭江夜景', '观景拍照'],
          },
          {
            name: '开禾路 / 周边小吃（可选）',
            area: '中山路附近',
            duration: '1 小时',
            tip: '想吃地道小食可绕开禾路；口味偏重，按肠胃选择。',
            highlights: ['面线糊', '土笋冻', '海蛎煎'],
          },
        ],
        meals: ['中山路或开禾路小吃拼一顿'],
        tips: [
          '此路线强度低，适合老人小孩或刚落地休整。',
          '若仍有精力，可临时买票上鼓浪屿，但半日会偏赶。',
        ],
      },
    ],
    '1day': [
      {
        id: 'xm-1day-classic',
        title: '经典一日：鼓浪屿 + 中山路',
        theme: '海岛 + 老城',
        summary: '上午上岛精华游，下午返陆逛中山路，晚上吃海鲜，是最稳妥的一日排法。',
        bestFor: '第一次来厦门 · 不想舟车劳顿',
        route: '轮渡 → 鼓浪屿（上午）→ 返陆午餐 → 中山路 → 晚餐海鲜',
        spots: [
          {
            name: '鼓浪屿（上午）',
            area: '全岛精华区',
            duration: '3.5–4.5 小时',
            tip: '尽量 8:30–9:00 前上岛；优先海岸线与龙头路，博物馆按兴趣选 1 个。',
            highlights: ['龙头路', '海岸步道', '皓月园'],
          },
          {
            name: '中山路步行街（下午）',
            area: '思明区',
            duration: '2–3 小时',
            tip: '避开正午暴晒，下午 3 点后再逛更舒服。',
            highlights: ['骑楼', '伴手礼', '咖啡馆'],
          },
          {
            name: '海鲜晚餐',
            area: '曾厝垵 / 中山路附近 / 八市周边',
            duration: '1.5 小时',
            tip: '称重海鲜先问清价格与加工费；人少店未必差，人多店也要看点评。',
            highlights: ['蒸海鲜', '蒜蓉虾', '时令鱼'],
          },
        ],
        meals: ['岛上早点或简餐', '陆上午餐轻食', '晚餐海鲜正餐'],
        tips: [
          '一日游不要再加环岛路自驾，容易变成赶路。',
          '夏天备防晒、水杯；鼓浪屿饮水点有限。',
          '行李可先放酒店，轻装上岛。',
        ],
      },
      {
        id: 'xm-1day-coast',
        title: '海岸一日：厦大外景 · 曾厝垵 · 环岛路',
        theme: '文艺海岸',
        summary: '不上鼓浪屿，主打校园外景、文艺渔村与环岛海风，适合喜欢海边骑行/驾车的人。',
        bestFor: '复游 · 不想排队上岛',
        route: '南普陀/厦大南门外景 → 曾厝垵 → 环岛路（黄厝/前埔段）→ 晚餐',
        spots: [
          {
            name: '南普陀寺（可选）',
            area: '思明区',
            duration: '1–1.5 小时',
            tip: '礼佛参观需着装得体；与厦大相邻，可串联。',
            highlights: ['寺院', '五老峰远眺'],
          },
          {
            name: '厦门大学南门 / 外围',
            area: '思明区',
            duration: '40–60 分钟',
            tip: '校区开放政策常变，以当日门口公告为准；多数情况可拍南门外景与芙蓉隧道预约制需另查。',
            highlights: ['校园外景', '建筑拍照'],
          },
          {
            name: '曾厝垵',
            area: '环岛路内侧',
            duration: '2–2.5 小时',
            tip: '小吃与文创密集，别只逛主街，小巷更有意思。',
            highlights: ['文创小店', '海鲜小吃', '咖啡馆'],
          },
          {
            name: '环岛路海岸段',
            area: '黄厝–前埔一带',
            duration: '1.5–2 小时',
            tip: '可骑行或打车多点停留；傍晚看海最舒服。',
            highlights: ['木栈道', '沙滩', '海风'],
          },
        ],
        meals: ['曾厝垵小吃午餐', '环岛路附近或市区海鲜晚餐'],
        tips: [
          '环岛路骑行注意机动车道，选正规租赁点并戴盔。',
          '夏天午后紫外线强，海边务必防晒。',
          '若只想轻松，可砍掉南普陀，直接曾厝垵+环岛路。',
        ],
      },
    ],
    '2day': [
      {
        id: 'xm-2day-essence',
        title: '两日精华：海岛一天 + 海岸一天',
        theme: '不赶路的完整厦门',
        summary: '第一天安心逛鼓浪屿与老城，第二天走校园外景、曾厝垵与环岛路，节奏适合大多数游客。',
        bestFor: '周末短途 · 第一次深度游',
        route: 'D1 鼓浪屿+中山路 → D2 南普陀/厦大外景+曾厝垵+环岛路',
        days: [
          {
            label: '第一天',
            theme: '鼓浪屿 + 中山路',
            spots: [
              {
                name: '鼓浪屿全日精华',
                area: '鼓浪屿',
                duration: '上午–下午',
                tip: '可增加一个付费景点（如菽庄花园或管风琴博物馆），仍留白休息。',
                highlights: ['龙头路', '海岸线', '别墅建筑'],
              },
              {
                name: '中山路夜游',
                area: '思明区',
                duration: '晚上',
                tip: '返陆后先休息再出门，夜景比下午更舒服。',
                highlights: ['骑楼夜景', '伴手礼'],
              },
            ],
            meals: ['岛上午餐', '中山路或附近海鲜晚餐'],
          },
          {
            label: '第二天',
            theme: '海岸线文艺线',
            spots: [
              {
                name: '南普陀 / 厦大南门外景',
                area: '思明区',
                duration: '上午',
                tip: '上午人相对少，拍照更干净。',
                highlights: ['寺院', '校园外景'],
              },
              {
                name: '曾厝垵',
                area: '环岛路',
                duration: '中午–下午',
                tip: '午餐放在曾厝垵最方便。',
                highlights: ['小吃', '文创'],
              },
              {
                name: '环岛路看海',
                area: '黄厝一带',
                duration: '下午–傍晚',
                tip: '日落前后离开最划算；返程可回市区或机场/高铁。',
                highlights: ['沙滩', '骑行', '日落'],
              },
            ],
            meals: ['曾厝垵午餐', '离厦前简餐或市区晚餐'],
          },
        ],
        tips: [
          '住宿建议选中山路 / 轮渡附近，或曾厝垵/环岛路（第二天更近）。',
          '两日游仍不必硬加集美、同安，留给下次或改三日。',
          '夏天可把高强度户外放早上，下午进咖啡馆躲晒。',
        ],
      },
      {
        id: 'xm-2day-slow',
        title: '两日慢游：少赶路 · 多留白',
        theme: '轻松节奏',
        summary: '同样覆盖鼓浪屿与海岸，但每天只抓 2–3 个点，适合带老人小孩或怕热怕挤的人。',
        bestFor: '亲子 / 长辈同行',
        route: 'D1 鼓浪屿半岛+海滨 → D2 中山路+曾厝垵（二选一加深）',
        days: [
          {
            label: '第一天',
            theme: '鼓浪屿慢半圈',
            spots: [
              {
                name: '轮渡上岛',
                duration: '上午',
                tip: '晚一点上岛也没关系，避开早高峰。',
                highlights: ['渡轮'],
              },
              {
                name: '龙头路 + 一处海岸/花园',
                duration: '中午–下午',
                tip: '只选一个付费园，多坐咖啡馆休息。',
                highlights: ['小吃', '海景', '休息'],
              },
            ],
            meals: ['岛上清淡午餐', '返陆后早晚餐'],
          },
          {
            label: '第二天',
            theme: '二选一加深',
            spots: [
              {
                name: '方案 A：中山路深度逛',
                duration: '半天',
                tip: '强度低，骑楼遮阴多。',
                highlights: ['老街', '甜品'],
              },
              {
                name: '方案 B：曾厝垵 + 短环岛',
                duration: '半天',
                tip: '打车点对点，不骑行也行。',
                highlights: ['渔村', '看海'],
              },
            ],
            meals: ['按所选方案就近解决'],
          },
        ],
        tips: [
          '每天预留 2 小时空白，别排满景点。',
          '准备防蚊、常温水、充电宝。',
          '若只有一晚，优先住轮渡附近减负。',
        ],
      },
    ],
  },
  ...OTHER_CITY_PLANS,
};

/** 福建手写行程（按 cityId）；供景点关联与任务目录继续使用 */
/** @type {Record<string, Record<string, Plan[]>>} */
export const CITY_TRAVEL_PLANS = mergeCityPlans(
  CITY_TRAVEL_PLANS_BASE,
  MORE_CITY_TRAVEL_PLANS,
  MORE_CITY_TRAVEL_PLANS_REST,
  LONG_CITY_TRAVEL_PLANS,
  LONG_CITY_TRAVEL_PLANS_REST,
  DRIVE_CITY_TRAVEL_PLANS,
);

/**
 * 全国行程：provinceId → cityId → durationId → Plan[]
 * 手写福建覆盖同省同市同天数生成结果
 * @type {Record<string, Record<string, Record<string, Plan[]>>>}
 */
export const NATIONAL_TRAVEL_PLANS = (() => {
  /** @type {Record<string, Record<string, Record<string, Plan[]>>>} */
  const out = {};
  const generated = travelPlansGenerated?.plans || {};

  for (const [provinceId, cities] of Object.entries(generated)) {
    out[provinceId] = {};
    for (const [cityId, byDuration] of Object.entries(cities || {})) {
      out[provinceId][cityId] = {};
      for (const [durationId, plans] of Object.entries(byDuration || {})) {
        out[provinceId][cityId][durationId] = [...(plans || [])];
      }
    }
  }

  // 手写福建优先：整段替换对应天数列表
  if (!out[FUJIAN_PLAN_CITY_PROVINCE]) out[FUJIAN_PLAN_CITY_PROVINCE] = {};
  for (const [cityId, byDuration] of Object.entries(CITY_TRAVEL_PLANS)) {
    if (!out[FUJIAN_PLAN_CITY_PROVINCE][cityId]) out[FUJIAN_PLAN_CITY_PROVINCE][cityId] = {};
    for (const [durationId, plans] of Object.entries(byDuration || {})) {
      if (plans?.length) {
        out[FUJIAN_PLAN_CITY_PROVINCE][cityId][durationId] = plans;
      }
    }
  }

  return out;
})();

export function getCityById(cityId, provinceId) {
  if (provinceId) {
    const city = getCityInProvince(provinceId, cityId);
    return city ? { ...city, provinceId } : null;
  }
  const fujian = FUJIAN_CITIES.find((c) => c.id === cityId);
  if (fujian) return { ...fujian, provinceId: FUJIAN_PLAN_CITY_PROVINCE };
  return getAllCities().find((c) => c.id === cityId) || null;
}

export function getDurationById(durationId) {
  return TRAVEL_DURATIONS.find((d) => d.id === durationId) || null;
}

export function getTravelPlans(provinceId, cityId, durationId) {
  // 兼容旧调用 getTravelPlans(cityId, durationId)（仅福建）
  if (durationId === undefined) {
    const legacyCityId = provinceId;
    const legacyDurationId = cityId;
    return CITY_TRAVEL_PLANS[legacyCityId]?.[legacyDurationId] || [];
  }
  return NATIONAL_TRAVEL_PLANS[provinceId]?.[cityId]?.[durationId] || [];
}

export function getTravelPlanById(planId) {
  for (const [provinceId, cities] of Object.entries(NATIONAL_TRAVEL_PLANS)) {
    for (const [cityId, byDuration] of Object.entries(cities || {})) {
      for (const [durationId, plans] of Object.entries(byDuration || {})) {
        const plan = (plans || []).find((item) => item.id === planId);
        if (plan) {
          return {
            plan,
            provinceId,
            cityId,
            durationId,
            city: getCityById(cityId, provinceId),
            province: getProvinceById(provinceId),
            duration: getDurationById(durationId),
          };
        }
      }
    }
  }
  return null;
}

export function cityHasAnyPlan(provinceId, cityId) {
  // 兼容旧调用 cityHasAnyPlan(cityId)
  if (cityId === undefined) {
    const legacyCityId = provinceId;
    const plans = CITY_TRAVEL_PLANS[legacyCityId];
    if (!plans) return false;
    return Object.values(plans).some((list) => list.length > 0);
  }
  const byDuration = NATIONAL_TRAVEL_PLANS[provinceId]?.[cityId];
  if (!byDuration) return false;
  return Object.values(byDuration).some((list) => list.length > 0);
}

export function getProvincesWithPlans() {
  return TRAVEL_PROVINCES.map((province) => {
    const cities = getCitiesWithPlans(province.id);
    const planCount = cities.reduce((sum, city) => sum + city.planCount, 0);
    return {
      ...province,
      cityCount: cities.length,
      planCount,
    };
  }).filter((p) => p.cityCount > 0);
}

export function getCitiesWithPlans(provinceId) {
  const province = getProvinceById(provinceId);
  if (!province) return [];
  return province.cities
    .map((city) => {
      const byDuration = NATIONAL_TRAVEL_PLANS[provinceId]?.[city.id] || {};
      const planCount = Object.values(byDuration).reduce((n, list) => n + (list?.length || 0), 0);
      return {
        ...city,
        provinceId,
        planCount,
      };
    })
    .filter((c) => c.planCount > 0);
}

export function countNationalTravelPlans() {
  if (countNationalTravelPlans._cached != null) return countNationalTravelPlans._cached;
  let n = 0;
  for (const cities of Object.values(NATIONAL_TRAVEL_PLANS)) {
    for (const byDuration of Object.values(cities || {})) {
      for (const plans of Object.values(byDuration || {})) {
        n += plans?.length || 0;
      }
    }
  }
  countNationalTravelPlans._cached = n;
  return n;
}

function scoreMatch(text, query) {
  const t = String(text || '').toLowerCase();
  const q = String(query || '').trim().toLowerCase();
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  return 0;
}

/**
 * 全国行程关键词搜索（省/市/行程标题等）
 * @returns {{ provinces: any[], cities: any[], plans: any[] }}
 */
export function searchTravelPlansCatalog(query, { limit = 8 } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { provinces: [], cities: [], plans: [] };

  const provinces = getProvincesWithPlans()
    .map((p) => ({
      item: p,
      score: Math.max(scoreMatch(p.name, q), scoreMatch(p.id, q), scoreMatch(p.shortName, q)),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);

  const cities = [];
  for (const province of getProvincesWithPlans()) {
    for (const city of getCitiesWithPlans(province.id)) {
      const cityScore = Math.max(scoreMatch(city.name, q), scoreMatch(city.id, q));
      if (cityScore <= 0) continue;
      cities.push({
        ...city,
        provinceId: province.id,
        provinceName: province.name,
        _score: cityScore,
      });
    }
  }
  cities.sort((a, b) => b._score - a._score);
  const cityHits = cities.slice(0, limit).map(({ _score, ...rest }) => rest);

  const planHits = [];
  outer: for (const [provinceId, cityMap] of Object.entries(NATIONAL_TRAVEL_PLANS)) {
    const province = getProvinceById(provinceId);
    for (const [cityId, byDuration] of Object.entries(cityMap || {})) {
      const city = getCityInProvince(provinceId, cityId);
      for (const [durationId, list] of Object.entries(byDuration || {})) {
        for (const plan of list || []) {
          const planScore = Math.max(
            scoreMatch(plan.title, q),
            scoreMatch(plan.theme, q),
            scoreMatch(plan.summary, q),
            scoreMatch(plan.bestFor, q),
            scoreMatch(plan.route, q)
          );
          if (planScore <= 0) continue;
          planHits.push({
            plan,
            provinceId,
            cityId,
            durationId,
            provinceName: province?.name || '',
            cityName: city?.name || '',
            _score: planScore,
          });
          if (planHits.length >= limit * 4) break outer;
        }
      }
    }
  }
  planHits.sort((a, b) => b._score - a._score);
  const plans = planHits.slice(0, limit).map(({ _score, ...rest }) => rest);

  return { provinces, cities: cityHits, plans };
}
