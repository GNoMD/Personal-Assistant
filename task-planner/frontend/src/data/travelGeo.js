/**
 * 全国旅行地理树：省 → 市（主线城市）
 * 福建九市 id 与 FUJIAN_CITIES / CITY_TRAVEL_PLANS 对齐
 */

/** @typedef {{ id: string, name: string }} GeoCity */
/** @typedef {{ id: string, name: string, shortName?: string, cities: GeoCity[] }} GeoProvince */

/** @type {GeoProvince[]} */
export const TRAVEL_PROVINCES = [
  {
    id: 'fujian',
    name: '福建',
    cities: [
      { id: 'xiamen', name: '厦门' },
      { id: 'quanzhou', name: '泉州' },
      { id: 'fuzhou', name: '福州' },
      { id: 'nanping', name: '南平' },
      { id: 'zhangzhou', name: '漳州' },
      { id: 'putian', name: '莆田' },
      { id: 'sanming', name: '三明' },
      { id: 'longyan', name: '龙岩' },
      { id: 'ningde', name: '宁德' },
    ],
  },
  {
    id: 'guangdong',
    name: '广东',
    cities: [
      { id: 'chaozhou', name: '潮州' },
      { id: 'shantou', name: '汕头' },
      { id: 'huizhou', name: '惠州' },
      { id: 'shenzhen', name: '深圳' },
      { id: 'guangzhou', name: '广州' },
      { id: 'shaoguan', name: '韶关' },
      { id: 'qingyuan', name: '清远' },
    ],
  },
  {
    id: 'guangxi',
    name: '广西',
    cities: [
      { id: 'guilin', name: '桂林' },
      { id: 'yangshuo', name: '阳朔' },
      { id: 'nanning', name: '南宁' },
      { id: 'beihai', name: '北海' },
    ],
  },
  {
    id: 'hainan',
    name: '海南',
    cities: [
      { id: 'haikou', name: '海口' },
      { id: 'wenchang', name: '文昌' },
      { id: 'qionghai', name: '琼海' },
      { id: 'wanning', name: '万宁' },
      { id: 'sanya', name: '三亚' },
      { id: 'lingshui', name: '陵水' },
    ],
  },
  {
    id: 'zhejiang',
    name: '浙江',
    cities: [
      { id: 'hangzhou', name: '杭州' },
      { id: 'shaoxing', name: '绍兴' },
      { id: 'ningbo', name: '宁波' },
      { id: 'zhoushan', name: '舟山' },
      { id: 'jinhua', name: '金华' },
      { id: 'lishui', name: '丽水' },
    ],
  },
  {
    id: 'shanghai',
    name: '上海',
    cities: [
      { id: 'shanghai', name: '上海市区' },
      { id: 'qingpu', name: '青浦' },
      { id: 'chongming', name: '崇明' },
    ],
  },
  {
    id: 'jiangsu',
    name: '江苏',
    cities: [
      { id: 'suzhou', name: '苏州' },
      { id: 'wuxi', name: '无锡' },
      { id: 'nanjing', name: '南京' },
      { id: 'yangzhou', name: '扬州' },
      { id: 'zhenjiang', name: '镇江' },
      { id: 'changzhou', name: '常州' },
    ],
  },
  {
    id: 'anhui',
    name: '安徽',
    cities: [
      { id: 'huangshan', name: '黄山' },
      { id: 'hefei', name: '合肥' },
      { id: 'wuhu', name: '芜湖' },
    ],
  },
  {
    id: 'jiangxi',
    name: '江西',
    cities: [
      { id: 'wuyuan', name: '婺源' },
      { id: 'jingdezhen', name: '景德镇' },
      { id: 'jiujiang', name: '九江' },
      { id: 'nanchang', name: '南昌' },
    ],
  },
  {
    id: 'hunan',
    name: '湖南',
    cities: [
      { id: 'changsha', name: '长沙' },
      { id: 'yueyang', name: '岳阳' },
      { id: 'zhangjiajie', name: '张家界' },
      { id: 'fenghuang', name: '凤凰' },
    ],
  },
  {
    id: 'hubei',
    name: '湖北',
    cities: [
      { id: 'wuhan', name: '武汉' },
      { id: 'yichang', name: '宜昌' },
      { id: 'enshi', name: '恩施' },
    ],
  },
  {
    id: 'henan',
    name: '河南',
    cities: [
      { id: 'zhengzhou', name: '郑州' },
      { id: 'kaifeng', name: '开封' },
      { id: 'luoyang', name: '洛阳' },
      { id: 'dengfeng', name: '登封' },
    ],
  },
  {
    id: 'shandong',
    name: '山东',
    cities: [
      { id: 'jinan', name: '济南' },
      { id: 'taian', name: '泰安' },
      { id: 'qingdao', name: '青岛' },
      { id: 'yantai', name: '烟台' },
      { id: 'weihai', name: '威海' },
    ],
  },
  {
    id: 'beijing',
    name: '北京',
    cities: [
      { id: 'beijing', name: '北京城区' },
      { id: 'huairou', name: '怀柔' },
      { id: 'miyun', name: '密云' },
      { id: 'yanqing', name: '延庆' },
    ],
  },
  {
    id: 'tianjin',
    name: '天津',
    cities: [
      { id: 'tianjin', name: '天津市区' },
      { id: 'binhai', name: '滨海新区' },
    ],
  },
  {
    id: 'hebei',
    name: '河北',
    cities: [
      { id: 'qinhuangdao', name: '秦皇岛' },
      { id: 'chengde', name: '承德' },
      { id: 'shijiazhuang', name: '石家庄' },
      { id: 'zhengding', name: '正定' },
    ],
  },
  {
    id: 'shanxi',
    name: '山西',
    cities: [
      { id: 'datong', name: '大同' },
      { id: 'pingyao', name: '平遥' },
      { id: 'taiyuan', name: '太原' },
    ],
  },
  {
    id: 'liaoning',
    name: '辽宁',
    cities: [
      { id: 'shenyang', name: '沈阳' },
      { id: 'dalian', name: '大连' },
      { id: 'dandong', name: '丹东' },
    ],
  },
  {
    id: 'jilin',
    name: '吉林',
    cities: [
      { id: 'changchun', name: '长春' },
      { id: 'jilin-city', name: '吉林市' },
      { id: 'changbaishan', name: '长白山' },
    ],
  },
  {
    id: 'heilongjiang',
    name: '黑龙江',
    cities: [
      { id: 'harbin', name: '哈尔滨' },
      { id: 'mudanjiang', name: '牡丹江' },
      { id: 'mohe', name: '漠河' },
    ],
  },
  {
    id: 'chongqing',
    name: '重庆',
    cities: [
      { id: 'chongqing', name: '重庆主城' },
      { id: 'wulong', name: '武隆' },
      { id: 'youyang', name: '酉阳' },
    ],
  },
  {
    id: 'sichuan',
    name: '四川',
    cities: [
      { id: 'chengdu', name: '成都' },
      { id: 'leshan', name: '乐山' },
      { id: 'emeishan', name: '峨眉山' },
      { id: 'jiuzhaigou', name: '九寨沟' },
      { id: 'kangding', name: '康定' },
      { id: 'litang', name: '理塘' },
    ],
  },
  {
    id: 'guizhou',
    name: '贵州',
    cities: [
      { id: 'guiyang', name: '贵阳' },
      { id: 'anshun', name: '安顺' },
      { id: 'kaili', name: '凯里' },
      { id: 'zhenyuan', name: '镇远' },
    ],
  },
  {
    id: 'yunnan',
    name: '云南',
    cities: [
      { id: 'kunming', name: '昆明' },
      { id: 'dali', name: '大理' },
      { id: 'lijiang', name: '丽江' },
      { id: 'shangri-la', name: '香格里拉' },
      { id: 'tengchong', name: '腾冲' },
    ],
  },
  {
    id: 'shaanxi',
    name: '陕西',
    cities: [
      { id: 'xian', name: '西安' },
      { id: 'huashan', name: '华山' },
      { id: 'yanan', name: '延安' },
    ],
  },
  {
    id: 'ningxia',
    name: '宁夏',
    cities: [
      { id: 'yinchuan', name: '银川' },
      { id: 'zhongwei', name: '中卫' },
    ],
  },
  {
    id: 'gansu',
    name: '甘肃',
    cities: [
      { id: 'lanzhou', name: '兰州' },
      { id: 'zhangye', name: '张掖' },
      { id: 'jiayuguan', name: '嘉峪关' },
      { id: 'dunhuang', name: '敦煌' },
    ],
  },
  {
    id: 'qinghai',
    name: '青海',
    cities: [
      { id: 'xining', name: '西宁' },
      { id: 'qinghai-lake', name: '青海湖' },
      { id: 'chaka', name: '茶卡' },
      { id: 'qilian', name: '祁连' },
    ],
  },
  {
    id: 'neimenggu',
    name: '内蒙古',
    cities: [
      { id: 'hohhot', name: '呼和浩特' },
      { id: 'baotou', name: '包头' },
      { id: 'ordos', name: '鄂尔多斯' },
      { id: 'alxa', name: '阿拉善' },
    ],
  },
  {
    id: 'xinjiang',
    name: '新疆',
    cities: [
      { id: 'urumqi', name: '乌鲁木齐' },
      { id: 'sayram', name: '赛里木湖' },
      { id: 'yining', name: '伊宁' },
      { id: 'nalati', name: '那拉提' },
      { id: 'burqin', name: '布尔津' },
      { id: 'kanas', name: '喀纳斯' },
    ],
  },
  {
    id: 'xizang',
    name: '西藏',
    cities: [
      { id: 'lhasa', name: '拉萨' },
      { id: 'nyingchi', name: '林芝' },
      { id: 'shigatse', name: '日喀则' },
      { id: 'everest', name: '珠峰大本营' },
    ],
  },
];

/** 福建计划城市 id → 省 id（抽取景点用） */
export const FUJIAN_PLAN_CITY_PROVINCE = 'fujian';

export function getProvinceById(provinceId) {
  return TRAVEL_PROVINCES.find((p) => p.id === provinceId) || null;
}

export function getCityInProvince(provinceId, cityId) {
  const province = getProvinceById(provinceId);
  return province?.cities.find((c) => c.id === cityId) || null;
}

export function getAllCities() {
  return TRAVEL_PROVINCES.flatMap((p) =>
    p.cities.map((c) => ({ ...c, provinceId: p.id, provinceName: p.name }))
  );
}
