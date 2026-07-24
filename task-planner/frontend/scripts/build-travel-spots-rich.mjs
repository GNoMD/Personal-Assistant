/**
 * 从 landmarks-*.mjs 生成带详述与配图的景点库
 * 用法（在 frontend 目录）: node scripts/build-travel-spots-rich.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LANDMARKS_EAST } from './spot-seeds/landmarks-east.mjs';
import { LANDMARKS_CENTRAL } from './spot-seeds/landmarks-central.mjs';
import { LANDMARKS_WEST } from './spot-seeds/landmarks-west.mjs';
// 注意：不再合并 landmarks-topup（模板胡编景点）。只保留人工精选 + 权威/校验过的真实景点。
import { LANDMARKS_EXTRA } from './spot-seeds/landmarks-extra.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outJson = path.join(root, 'src/data/travelSpotsRich.json');
const outGeo = path.join(root, 'src/data/travelGeo.generated.json');
const coverDir = path.join(root, 'public/travel-covers');

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

const CITY_NAME_OVERRIDES = {
  huangpu: '黄浦', xuhui: '徐汇', pudong: '浦东', songjiang: '松江',
  qingpu: '青浦', chongming: '崇明', jiading: '嘉定', minhang: '闵行',
  yangpu: '杨浦', hongkou: '虹口',
  dongcheng: '东城', xicheng: '西城', chaoyang: '朝阳', haidian: '海淀',
  fengtai: '丰台', shijingshan: '石景山', tongzhou: '通州', changping: '昌平',
  huairou: '怀柔', miyun: '密云', yanqing: '延庆', mentougou: '门头沟',
  pinggu: '平谷', shunyi: '顺义', daxing: '大兴',
  heping: '和平', hexi: '河西', nankai: '南开', hongqiao: '红桥',
  hedong: '河东', binhai: '滨海新区', wuqing: '武清', jizhou: '蓟州',
};

const CATEGORY_META = {
  自然风光: { duration: '半天～1 天', cover: 'nature', hue: 145 },
  历史人文: { duration: '2～4 小时', cover: 'heritage', hue: 28 },
  古镇街区: { duration: '2～4 小时', cover: 'town', hue: 18 },
  博物馆: { duration: '1.5～3 小时', cover: 'museum', hue: 210 },
  主题乐园: { duration: '1 天', cover: 'park', hue: 320 },
  宗教寺庙: { duration: '1～3 小时', cover: 'temple', hue: 0 },
  海滨湖泊: { duration: '半天', cover: 'water', hue: 195 },
  山地峡谷: { duration: '半天～1 天', cover: 'mountain', hue: 95 },
  公园休闲: { duration: '1～3 小时', cover: 'garden', hue: 120 },
  美食购物: { duration: '1～3 小时', cover: 'food', hue: 35 },
};

/** 按类型匹配的实景图（Unsplash），同类型内按景点 id 稳定轮换，避免再出现「寺庙配美食图」 */
const CATEGORY_PHOTOS = {
  自然风光: [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  历史人文: [
    'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  古镇街区: [
    'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  博物馆: [
    'https://images.unsplash.com/photo-1566127444979-b95d1874eaca?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  主题乐园: [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1513889961551-89a4b6f7c7c4?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1461237439866-5a55729c52b4?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  宗教寺庙: [
    'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  海滨湖泊: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  山地峡谷: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  公园休闲: [
    'https://images.unsplash.com/photo-1446071103084-c257b5bea0b5?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1464983308776-3c7215089494?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=960&h=640&q=80',
  ],
  美食购物: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=960&h=640&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=960&h=640&q=80',
  ],
};

/** 知名景点优先使用更贴近主题的实景图（禁配冰雪高山给亚热带景点） */
const LANDMARK_PHOTOS = {
  鼓浪屿: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
  日光岩: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
  皓月园: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=960&h=640&q=80',
  菽庄花园: 'https://images.unsplash.com/photo-1446071103084-c257b5bea0b5?auto=format&fit=crop&w=960&h=640&q=80',
  南普陀寺: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=960&h=640&q=80',
  中山路: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=960&h=640&q=80',
  环岛路: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
  曾厝垵: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=960&h=640&q=80',
  沙坡尾: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=960&h=640&q=80',
  西湖: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=960&h=640&q=80',
  故宫博物院: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=960&h=640&q=80',
  故宫: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=960&h=640&q=80',
  长城: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=960&h=640&q=80',
  八达岭长城: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=960&h=640&q=80',
  秦始皇兵马俑博物馆: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=960&h=640&q=80',
  兵马俑: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=960&h=640&q=80',
  黄山风景区: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=960&h=640&q=80',
  黄山: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=960&h=640&q=80',
  外滩: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&w=960&h=640&q=80',
  布达拉宫: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=960&h=640&q=80',
  丽江古城: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=960&h=640&q=80',
  张家界: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=960&h=640&q=80',
  武陵源核心景区: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=960&h=640&q=80',
  天山天池: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=960&h=640&q=80',
  青海湖: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=960&h=640&q=80',
  莫高窟: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=960&h=640&q=80',
  拙政园: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=960&h=640&q=80',
  颐和园: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=960&h=640&q=80',
  三亚亚龙湾: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
  亚龙湾: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
};

/** 亚热带沿海：禁止冰雪高山图 */
const SUBTROPICAL_COAST = new Set([
  'fujian', 'guangdong', 'guangxi', 'hainan', 'zhejiang', 'shanghai', 'jiangsu', 'taiwan',
]);

/** 高寒/高原：才允许冰雪山地氛围 */
const HIGHLAND_COLD = new Set([
  'xizang', 'qinghai', 'xinjiang', 'gansu', 'neimenggu', 'ningxia', 'heilongjiang', 'jilin', 'liaoning',
]);

/** 南方低山/海岛丘陵图（替代雪峰） */
const SOUTH_HILL_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&h=640&q=80',
  'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=960&h=640&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=960&h=640&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=960&h=640&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=960&h=640&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=960&h=640&q=80',
];

function resolveLandmarkPhoto(name) {
  if (LANDMARK_PHOTOS[name]) return LANDMARK_PHOTOS[name];
  const hit = Object.entries(LANDMARK_PHOTOS).find(([key]) => name.includes(key));
  return hit?.[1] || null;
}

function photoPoolFor(category, provinceId) {
  if (
    (category === '山地峡谷' || category === '自然风光')
    && SUBTROPICAL_COAST.has(provinceId)
  ) {
    return SOUTH_HILL_PHOTOS;
  }
  return CATEGORY_PHOTOS[category] || CATEGORY_PHOTOS['公园休闲'];
}

function pickPhotos(name, category, seedText, provinceId) {
  const pool = photoPoolFor(category, provinceId);
  const n = pool.length;
  const h = parseInt(shortHash(seedText), 36) || 0;
  const i0 = h % n;
  const i1 = (h + 1) % n;
  const i2 = (h + 2) % n;
  const landmark = resolveLandmarkPhoto(name);
  const cover = landmark || pool[i0];
  const images = landmark
    ? [landmark, pool[i0], pool[i1]]
    : [pool[i0], pool[i1], pool[i2]];
  return { coverImage: cover, images, hasLandmark: Boolean(landmark) };
}

function seasonHint(category, provinceId) {
  const south = SUBTROPICAL_COAST.has(provinceId);
  const cold = HIGHLAND_COLD.has(provinceId);

  if (category === '海滨湖泊') {
    return south
      ? '全年可游，夏秋更舒适；注意防晒与台风预警'
      : '夏秋更舒适；注意防晒与风浪';
  }
  if (category === '山地峡谷' || category === '自然风光') {
    if (south) return '春秋最佳；夏季防晒防雨，冬季温和少冰雪';
    if (cold) return '夏秋窗口更友好；冬季注意高寒、冰雪路段与续航/体力';
    return '春秋最佳；雨雾天慎入险段，量力而行';
  }
  if (category === '公园休闲') return south ? '全年可逛，晨晚更舒适' : '晨晚更舒适；周末本地人多';
  return SEASON_BY_CAT[category] || '全年可游，节假日建议错峰';
}

const SEASON_BY_CAT = {
  自然风光: '春秋季景色更佳，夏季注意防晒防雨，冬季留意道路与保暖。',
  历史人文: '全年可游；节假日人流大，建议错峰并提前预约票务。',
  古镇街区: '傍晚与夜景氛围更好；雨天石板路湿滑，穿防滑鞋。',
  博物馆: '闭馆日与预约规则请查官方；讲解器或人工讲解更易理解展陈。',
  主题乐园: '旺季排队久，可关注快速通行与开放时间；留意身高与安全须知。',
  宗教寺庙: '着装得体，遵守香火与摄影规定；大型法会期间更拥挤。',
  海滨湖泊: '注意风浪与游泳安全；海边防晒、湖区昼夜温差都要准备。',
  山地峡谷: '量力而行，预留体力与返程时间；雨雾天慎入险段。',
  公园休闲: '晨晚更舒适；周末本地人多，适合散步放空。',
  美食购物: '注意消费与食品安全；热门街区保管好随身物品。',
};

function shortHash(text) {
  let h = 2166136261;
  const s = String(text || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** 按省合并多份种子（同省数组拼接，不能 Object.assign 覆盖） */
function mergeLandmarks(...groups) {
  const out = {};
  for (const group of groups) {
    for (const [provinceId, list] of Object.entries(group || {})) {
      if (!out[provinceId]) out[provinceId] = [];
      out[provinceId].push(...(list || []));
    }
  }
  return out;
}

function provinceAdminLabel(provinceName) {
  if (['北京', '天津', '上海', '重庆'].includes(provinceName)) return `${provinceName}市`;
  if (provinceName === '内蒙古') return '内蒙古自治区';
  if (provinceName === '西藏') return '西藏自治区';
  if (provinceName === '广西') return '广西壮族自治区';
  if (provinceName === '宁夏') return '宁夏回族自治区';
  if (provinceName === '新疆') return '新疆维吾尔自治区';
  return `${provinceName}省`;
}

function cityAdminLabel(cityName, provinceName) {
  if (!cityName) return '';
  if (/[市区县州盟旗]$/.test(cityName)) return cityName;
  if (['北京', '天津', '上海', '重庆'].includes(provinceName)) {
    return /[区县]$/.test(cityName) ? cityName : `${cityName}区`;
  }
  return `${cityName}市`;
}

function areaAdminLabel(area, cityName) {
  const a = String(area || '').trim();
  if (!a || a === cityName || a === `${cityName}市`) return '';
  if (/[区县市镇乡街道]$/.test(a)) return a;
  // 已是具体片区/地标名，不再强行加「区」
  if (/(园|寺|庙|街|路|村|湾|港|屿|岛|湖|江|河|峰|山|滩|岩|塔|桥|堡|宫|苑|林|城|镇|寨|坡|窟|峡|瀑布|景区|公园|炮台|沙滩|海滩|学村|影视城|码头|广场|步行街)/.test(a)) {
    return a;
  }
  // 常见行政区简称：思明、湖里、集美…
  if (/^[\u4e00-\u9fff]{2,3}$/.test(a)) return `${a}区`;
  return a;
}

/** 可读位置：省 + 市 + 区县/片区（不胡编具体门牌） */
function buildLocation(provinceName, cityName, area, rawLocation) {
  if (rawLocation && String(rawLocation).trim()) return String(rawLocation).trim();
  return [
    provinceAdminLabel(provinceName),
    cityAdminLabel(cityName, provinceName),
    areaAdminLabel(area, cityName),
  ].filter(Boolean).join('');
}

/** 明显模板/占位名，重建时丢弃 */
const FAKE_SPOT_NAME_RE = /(社区公园\d*|文化驿站\d*|观景节点\d*|城市公园\d+|步行街区\d+|观景台\d+|网红打卡墙|欢乐谷风格乐园|流动博物馆|临时展览馆|设计周展场|城市中心步行区|城市博物馆\/规划馆|城市公园$|特色商业街区|近郊观景点|文化古迹点|水岸步道|本地寺庙\/祠堂)/;

function isRealSpotName(name) {
  const n = String(name || '').trim();
  if (n.length < 2) return false;
  if (FAKE_SPOT_NAME_RE.test(n)) return false;
  if (/^[A-Za-z0-9\s\-_.]+$/.test(n)) return false;
  return true;
}

function writeCovers() {
  fs.mkdirSync(coverDir, { recursive: true });
  for (const [label, meta] of Object.entries(CATEGORY_META)) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${meta.hue} 42% 42%)"/>
      <stop offset="55%" stop-color="hsl(${(meta.hue + 28) % 360} 38% 28%)"/>
      <stop offset="100%" stop-color="hsl(${(meta.hue + 50) % 360} 30% 16%)"/>
    </linearGradient>
  </defs>
  <rect width="960" height="640" fill="url(#g)"/>
  <circle cx="760" cy="120" r="160" fill="rgba(255,255,255,0.08)"/>
  <circle cx="120" cy="520" r="200" fill="rgba(0,0,0,0.12)"/>
  <text x="64" y="520" fill="rgba(255,255,255,0.92)" font-size="52" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-weight="600">${label}</text>
  <text x="64" y="568" fill="rgba(255,255,255,0.65)" font-size="24" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">Travel Spot Cover</text>
</svg>`;
    fs.writeFileSync(path.join(coverDir, `${meta.cover}.svg`), svg, 'utf8');
  }
}

function buildIntro(spot, provinceName) {
  const cat = spot.category || '公园休闲';
  const city = spot.cityName || spot.area || '当地';
  const area = spot.area || city;
  const location = spot.location || `${provinceName}${city}${area && area !== city ? area : ''}`;
  const season = SEASON_BY_CAT[cat] || SEASON_BY_CAT['公园休闲'];

  const p1 = `${spot.name}位于${location}，是当地颇具代表性的「${cat}」类目的地。无论是第一次到访还是回头客，都可以把它当作理解这座城市气质与历史脉络的一个入口：在有限的半天到一天时间里，既能看到标志性景观，也能感受到周边街区、自然或人文氛围。`;

  const p2 = cat === '博物馆' || cat === '历史人文'
    ? `走进${spot.name}，建议先花几分钟了解展陈动线或景区导览图，再按兴趣深入。展板、文物与历史场景往往比拍照点更能回答「这里为什么重要」。若有定时讲解或数字导览，优先跟上一次完整叙事，回来后再针对感兴趣的单元细看，体验会完整很多。`
    : cat === '山地峡谷' || cat === '自然风光'
      ? `${spot.name}的核心魅力来自地形与季相变化。登高、临谷或穿行林间时，请把体力分配留出返程余量，并关注当天天气与景区交通管制。摄影爱好者可留意清晨与傍晚光线；普通访客则更适合把节奏放慢，在观景台、栈道与休息点之间切换，而不是一味赶路打卡。`
      : cat === '海滨湖泊'
        ? `${spot.name}以水景见长，适合散步、看日出日落或做一次不赶场的短停留。海边注意潮汐与风浪提示，湖区注意栈道湿滑与救生规定。带一件薄外套往往比想象中更有用——水边风大，体感温度常低于城区。`
        : cat === '古镇街区' || cat === '美食购物'
          ? `${spot.name}更适合「逛起来」：巷弄转折、店铺橱窗与本地烟火气，往往比单一打卡点更能留下印象。热门时段人流密集，可以把正餐与购物安排错开高峰，并提前想好交通接驳（地铁、公交或停车位置），避免逛到腿软还找不到回去的路。`
          : cat === '宗教寺庙'
            ? `${spot.name}作为宗教与文化场所，参观时请保持安静、着装得体，遵守香火、摄影与开放区域规定。比起匆忙盖章打卡，留出时间走走庭院、读读碑刻与匾额，更容易体会建筑布局与地方信仰传统。`
            : `${spot.name}适合作为一种放松式到访：不必把行程排得过满，把时间留给散步、休息和观察当地人的使用方式。若与周边景点连线，建议把这里放在上下午过渡段，既能缓冲体力，也能让整天节奏张弛有度。`;

  const p3 = `交通与时间方面，建议预留「到达 + 游览 + 返程」的完整窗口，而不是只按景点官网的「建议游玩时长」硬套。${CATEGORY_META[cat]?.duration || '2～4 小时'}通常是核心游览参考；若你喜欢拍照、参观展陈或带老人小孩，请再上浮 30%～50%。节假日与暑假期间，安检、摆渡与热门点位排队都会显著变长。`;

  const p4 = `票务与现场体验请以官方最新公告为准：是否需要实名预约、是否分时段入园、学生/老人优惠如何核验，都可能随季节调整。进入景区后先确认卫生间、饮水、医疗点与出入口位置；夏季补水防晒，冬季防滑保暖。自驾访客请提前查看停车场与充电桩（电车出行尤其重要），公共交通访客则建议把末班车时间写进行程。`;

  const p5 = `游览提示：${season} 若把${spot.name}放进多日路线，可与同城其他${cat}或互补类型景点搭配，避免连续高强度爬山或连续密集博物馆。结束游览后，可在周边找一家评价稳定的本地餐馆简单用餐，把「到过」变成「待过」，记忆通常会更深。`;

  return [p1, p2, p3, p4, p5].join('\n\n');
}

function buildTips(spot) {
  const cat = spot.category || '公园休闲';
  return [
    `建议游玩时长约 ${CATEGORY_META[cat]?.duration || '2～4 小时'}，含往返缓冲更从容。`,
    '出发前核对开放时间、预约规则与交通管制，以官方信息为准。',
    seasonHint(cat, spot.provinceId),
    '保管好证件与电子设备；热门点注意文明排队与垃圾带走。',
  ];
}

function buildHighlights(spot) {
  const base = [spot.category, spot.cityName, spot.area].filter(Boolean);
  const extras = {
    自然风光: ['观景', '徒步'],
    历史人文: ['文化', '讲解'],
    古镇街区: ['夜景', '漫步'],
    博物馆: ['展陈', '预约'],
    主题乐园: ['亲子', '项目'],
    宗教寺庙: ['建筑', '静心'],
    海滨湖泊: ['水景', '日落'],
    山地峡谷: SUBTROPICAL_COAST.has(spot.provinceId) ? ['登高', '海岛岩壁'] : ['登高', '峡谷'],
    公园休闲: ['散步', '休闲'],
    美食购物: ['小吃', '伴手礼'],
  };
  return [...new Set([...base, ...(extras[spot.category] || ['打卡'])])].slice(0, 6);
}

function main() {
  writeCovers();
  const allLandmarks = mergeLandmarks(
    LANDMARKS_EAST,
    LANDMARKS_CENTRAL,
    LANDMARKS_WEST,
    LANDMARKS_EXTRA
  );
  const citiesByProvince = {};
  const spots = [];
  const usedIds = new Set();
  const usedNamesByCity = new Set();

  for (const [provinceId, list] of Object.entries(allLandmarks)) {
    const provinceName = PROVINCE_NAMES[provinceId] || provinceId;
    const cityMap = new Map();

    for (const raw of list) {
      if (!raw?.name || !raw?.cityId) continue;
      if (!isRealSpotName(raw.name)) continue;
      const cityId = String(raw.cityId);
      let cityName = CITY_NAME_OVERRIDES[cityId] || raw.cityName || raw.area || cityId;
      if (cityName === PROVINCE_NAMES[provinceId] && CITY_NAME_OVERRIDES[cityId]) {
        cityName = CITY_NAME_OVERRIDES[cityId];
      }
      const nameKey = `${provinceId}/${cityId}/${String(raw.name).replace(/\s+/g, '')}`;
      if (usedNamesByCity.has(nameKey)) continue;
      usedNamesByCity.add(nameKey);

      if (!cityMap.has(cityId)) cityMap.set(cityId, cityName);
      else if (CITY_NAME_OVERRIDES[cityId]) cityMap.set(cityId, CITY_NAME_OVERRIDES[cityId]);

      const category = CATEGORY_META[raw.category] ? raw.category : '公园休闲';
      const meta = CATEGORY_META[category];
      let id = `${provinceId}-${cityId}-${shortHash(raw.name)}`;
      if (usedIds.has(id)) {
        let n = 2;
        while (usedIds.has(`${id}-${n}`)) n += 1;
        id = `${id}-${n}`;
      }
      usedIds.add(id);

      const area = areaAdminLabel(raw.area, cityName) || cityName;
      const location = buildLocation(provinceName, cityName, area, raw.location);
      const coverImageMeta = pickPhotos(raw.name, category, `${provinceId}-${cityId}-${raw.name}`, provinceId);
      const coverImage = coverImageMeta.coverImage;
      const images = coverImageMeta.images;
      const fallbackCover = `/travel-covers/${meta.cover}.svg`;

      const summary = `${provinceName}${cityName}的${category}代表景点之一，适合安排 ${meta.duration} 深度游览。`;
      const spotPayload = {
        id,
        name: raw.name,
        provinceId,
        cityId,
        area,
        location,
        duration: meta.duration,
        category,
        summary,
        tip: summary,
        intro: buildIntro({ ...raw, category, cityName, area, location }, provinceName),
        tips: buildTips({ ...raw, category, provinceId }),
        highlights: buildHighlights({ ...raw, category, cityName, provinceId, area }),
        coverImage,
        images,
        fallbackCover,
        imageNote: coverImageMeta.hasLandmark
          ? '配图为该景点相关实景参考图'
          : `配图按「${category}」与当地气候匹配氛围图，非逐景点官方实拍`,
        bestSeason: seasonHint(category, provinceId),
        ticketHint: '门票、预约与优惠政策请以景区/场馆官方最新公告为准。',
      };
      if (typeof raw.lat === 'number') spotPayload.lat = raw.lat;
      if (typeof raw.lng === 'number') spotPayload.lng = raw.lng;
      spots.push(spotPayload);
    }

    citiesByProvince[provinceId] = [...cityMap.entries()].map(([id, name]) => ({ id, name }));
  }

  const provinces = Object.keys(PROVINCE_NAMES).map((id) => ({
    id,
    name: PROVINCE_NAMES[id],
    cities: citiesByProvince[id] || [],
    spotCount: spots.filter((s) => s.provinceId === id).length,
  }));

  const payload = {
    generatedAt: new Date().toISOString(),
    provinceCount: provinces.length,
    spotCount: spots.length,
    provinces,
    spots,
  };

  const outJs = path.join(root, 'src/data/travelSpotsRich.js');
  const outGeoJs = path.join(root, 'src/data/travelGeo.generated.js');

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(payload), 'utf8');
  fs.writeFileSync(outJs, `/* auto-generated */\nexport default ${JSON.stringify(payload)};\n`, 'utf8');
  fs.writeFileSync(
    outGeo,
    JSON.stringify({ provinces: provinces.map(({ id, name, cities }) => ({ id, name, cities })) }, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    outGeoJs,
    `/* auto-generated */\nexport default ${JSON.stringify({
      provinces: provinces.map(({ id, name, cities }) => ({ id, name, cities })),
    })};\n`,
    'utf8'
  );

  console.log(`wrote ${spots.length} spots -> ${path.relative(root, outJs)}`);
  for (const p of provinces) {
    console.log(`  ${p.name}: ${p.spotCount} spots / ${p.cities.length} cities`);
  }
}

main();
