/**
 * 生成三日/四日/五日及以上旅行计划数据文件
 * 运行: node scripts/genTravelLongPlans.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../frontend/src/data');

const CITIES = {
  xiamen: {
    name: '厦门',
    prefix: 'xm',
    areas: {
      island: [
        ['鼓浪屿核心街区', '鼓浪屿', '全天', '付费园选 1–2 个，留白看海。', ['海岛', '建筑']],
        ['菽庄花园 / 皓月园', '鼓浪屿', '半天', '排队长可改海岸线散步。', ['花园', '海景']],
        ['龙头路与港仔后', '鼓浪屿', '穿插', '小吃适量，别家家吃。', ['小吃']],
      ],
      south: [
        ['中山路骑楼', '思明', '半天', '早晚光线更好。', ['骑楼']],
        ['南普陀寺', '思明', '半天', '着装得体，保持安静。', ['寺庙']],
        ['厦大 / 白城沙滩', '思明', '半天', '校园开放以公告为准。', ['校园', '海滩']],
        ['沙坡尾避风坞', '思明', '半天', '咖啡馆与文创，适合傍晚。', ['文创', '港湾']],
        ['曾厝垵渔村', '思明', '半天', '人多可转环岛咖啡馆。', ['渔村']],
        ['环岛路骑行 / 观光', '思明', '半天–一天', '防晒与补水，量力而行。', ['骑行', '海景']],
      ],
      north: [
        ['集美学村', '集美', '全天', '嘉庚建筑与龙舟池。', ['嘉庚建筑']],
        ['园博苑', '集美', '全天', '园区大，选 2–3 展园即可。', ['园林', '亲子']],
        ['杏林湾周边', '集美', '半天', '适合轻松散步。', ['湾区']],
      ],
      outer: [
        ['同安影视城 / 梵天寺一带', '同安', '一天', '适合想出城换景。', ['古迹', '影视']],
        ['大嶝岛战地小镇', '翔安', '一天', '往返车程长，早出晚归。', ['海岛', '战地']],
        ['海沧狮山公园', '海沧', '一天', '登山观城，备水。', ['登山']],
      ],
    },
    food: ['沙茶面', '海鲜蒸笼', '花生汤', '土笋冻', '烧肉粽'],
    stayTips: ['思明住便利逛岛；想安静可住集美地铁沿线。'],
  },
  fuzhou: {
    name: '福州',
    prefix: 'fz',
    areas: {
      oldtown: [
        ['三坊七巷', '鼓楼', '全天', '南后街外人流量小，深入侧巷。', ['坊巷', '古建']],
        ['朱紫坊与安泰河', '鼓楼', '半天', '夜景灯光更出片。', ['夜景', '古建']],
        ['福州文庙 / 于山', '鼓楼', '半天', '城中登高短走走。', ['文庙', '山景']],
        ['乌山景区', '鼓楼', '半天', '轻徒步俯瞰城区。', ['登山']],
      ],
      river: [
        ['烟台山历史风貌区', '仓山', '全天', '坡路多，穿防滑鞋。', ['洋房', '江景']],
        ['上下杭街区', '台江', '全天', '码头商埠气质，咖啡店多。', ['老街', '咖啡']],
        ['闽江江滨步道', '台江/仓山', '半天', '傍晚骑行或散步。', ['江滨']],
        ['达明美食街', '鼓楼', '半天', '鱼丸肉燕适量。', ['美食']],
      ],
      green: [
        ['西湖公园', '鼓楼', '半天–一天', '环湖与租船，亲子友好。', ['湖景', '亲子']],
        ['左海公园', '鼓楼', '半天', '动物园可选，注意开放时间。', ['公园']],
        ['福州国家森林公园', '晋安', '一天', '暑热天选林荫道。', ['森林']],
      ],
      outer: [
        ['鼓山涌泉寺', '晋安', '一天', '索道+步行结合，量力。', ['寺庙', '登山']],
        ['长乐滨海 / 金刚腿一带', '长乐', '一天', '看海吹风，备防晒。', ['滨海']],
        ['平潭一日连线（可选）', '平潭', '一天', '高铁或车，时间紧只看主沙滩。', ['海岛']],
        ['永泰青云山（可选）', '永泰', '一天', '漂流或徒步二选一。', ['自然']],
      ],
    },
    food: ['鱼丸', '肉燕', '荔枝肉', '佛跳墙（适量）', '线上小吃'],
    stayTips: ['住鼓楼/台江方便逛古城；过江景点预留交通时间。'],
  },
  quanzhou: {
    name: '泉州',
    prefix: 'qz',
    areas: {
      oldtown: [
        ['开元寺与东西塔', '鲤城', '半天–一天', '海丝地标，保持安静。', ['寺庙', '海丝']],
        ['西街慢逛', '鲤城', '半天', '钟楼到开元寺轴线。', ['老街']],
        ['清净寺 / 关岳庙 / 涂门街', '鲤城', '半天', '世界宗教博物馆气质。', ['多元宗教']],
        ['天后宫与德济门', '鲤城', '半天', '妈祖与城墙遗迹。', ['妈祖', '海丝']],
        ['金鱼巷与中山路', '鲤城', '半天', '巷弄咖啡与伴手礼。', ['巷弄']],
      ],
      mountain: [
        ['清源山', '丰泽', '一天', '老君岩必看，防晒补水。', ['登山', '道教']],
        ['灵山圣墓', '丰泽', '半天', '伊斯兰古迹，尊重规制。', ['海丝']],
      ],
      coast: [
        ['崇武古城', '惠安', '一天', '石头城看海，惠女服饰文化。', ['古城', '海景']],
        ['洛阳桥', '洛江', '半天', '古桥海潮，注意潮汐安全。', ['古桥']],
      ],
      outer: [
        ['安溪茶乡体验', '安溪', '一天', '品茶学冲泡，少买冲动货。', ['茶文化']],
        ['永春 / 德化选一', '永春或德化', '一天', '陶瓷或山水，车程预留。', ['非遗', '山水']],
        ['晋江五店市', '晋江', '半天–一天', '闽南建筑聚落。', ['古厝']],
      ],
    },
    food: ['牛肉羹', '润饼', '面线糊', '姜母鸭', '四果汤'],
    stayTips: ['鲤城古城核心住一晚最省腿；崇武/安溪过夜可深化。'],
  },
  zhangzhou: {
    name: '漳州',
    prefix: 'zz',
    areas: {
      city: [
        ['薌城老街与中山公园', '芗城', '半天', '闽南市井节奏。', ['老街']],
        ['南山寺', '芗城', '半天', '古刹祈福。', ['寺庙']],
        ['花博园 / 滨江', '龙文附近', '半天–一天', '花卉与亲子散步。', ['花卉', '亲子']],
        ['碧湖生态园', '芗城', '半天', '城市绿肺环湖。', ['湖景']],
      ],
      south: [
        ['东山岛风动石', '东山', '一天', '风动石与铜陵渔港。', ['海岛']],
        ['东山金銮湾 / 马銮湾', '东山', '一天', '游泳看日出，注意安全。', ['海滩']],
        ['诏安 / 云霄滨海选点', '诏安或云霄', '一天', '渔村风情，美食要新鲜。', ['渔村']],
      ],
      west: [
        ['南靖土楼云水谣', '南靖', '一天', '古道与土楼群，步行多。', ['土楼', '古道']],
        ['田螺坑土楼群', '南靖', '半天–一天', '四菜一汤经典俯瞰。', ['土楼', '摄影']],
        ['华安大地土楼群', '华安', '一天', '相对小众，适合摄影。', ['土楼']],
      ],
      nature: [
        ['漳浦火山岛地质公园', '漳浦', '一天', '玄武岩海岸，防晒。', ['地质', '海景']],
        ['平和三平寺', '平和', '一天', '祈福名寺，人流大注意秩序。', ['寺庙']],
        ['长泰天柱山', '长泰', '一天', '轻徒步与漂流季可选。', ['自然']],
      ],
    },
    food: ['卤面', '手抓面', '四果汤', '海鲜', '片仔癀鸡（适量）'],
    stayTips: ['市区+东山/南靖 overnight 可拆开；土楼过夜体验更佳。'],
  },
  putian: {
    name: '莆田',
    prefix: 'pt',
    areas: {
      city: [
        ['文献步行街与东岩山', '城厢', '半天', '城市轻松半日扩一日。', ['老街', '登山']],
        ['湄洲岛祖庙', '湄洲', '一天', '妈祖祖庙核心，敬香勿扰。', ['妈祖']],
        ['湄洲岛黄金沙滩', '湄洲', '半天–一天', '看海日落，备防蚊。', ['海滩']],
        ['南少林寺遗址园区', '荔城', '半天', '南少林文化线。', ['武术文化']],
      ],
      north: [
        ['九鲤湖瀑布群', '仙游', '一天', '徒步看瀑，鞋底防滑。', ['瀑布', '徒步']],
        ['仙游白塔 / 菜溪岩选一', '仙游', '一天', '山林清幽，适合慢节奏。', ['山林']],
        ['木雕博物馆 / 工艺线', '仙游/城厢', '半天', '了解莆田工艺名片。', ['非遗']],
      ],
      coast: [
        ['平海古城', '秀屿', '半天–一天', '海边古城短走走。', ['古城', '海']],
        ['忠门半岛海景', '秀屿', '半天', '开车串联观景点。', ['半岛']],
        ['荔城古谯楼一带', '荔城', '半天', '夜市与小吃收尾。', ['美食']],
      ],
      relax: [
        ['城厢公园绿道', '城厢', '半天', '留白休息日。', ['散步']],
        ['工艺城伴手礼采买', '城厢', '半天', '木雕银饰适可。', ['购物']],
        ['烧烤海鲜夜', '沿海乡镇', '夜间', '选口碑店，注意卫生。', ['海鲜']],
      ],
    },
    food: ['卤面', '兴化米粉', '焖豆腐', '海鲜', '桂圆'],
    stayTips: ['上湄洲建议住岛一晚看日出；九鲤湖可住仙游。'],
  },
  sanming: {
    name: '三明',
    prefix: 'sm',
    areas: {
      city: [
        ['三元区江滨与列东', '三元', '半天', '城市休整与补给。', ['城市']],
        ['格氏栲自然保护区', '三元', '一天', '森林氧吧，防蚊。', ['森林']],
        ['瑞云山', '梅列/三元', '半天–一天', '城郊轻徒步。', ['登山']],
      ],
      east: [
        ['泰宁大金湖', '泰宁', '一天–两天', '游船与丹霞岸线。', ['丹霞', '湖泊']],
        ['尚书第古建筑群', '泰宁', '半天', '明清代建筑，适合慢逛。', ['古建']],
        ['泰宁古城街巷', '泰宁', '半天', '住古城方便早出。', ['古城']],
        ['猫儿山地质公园', '泰宁', '一天', '丹霞徒步，强度中等。', ['丹霞', '徒步']],
      ],
      south: [
        ['永安桃源洞', '永安', '一天', '一线天经典，注意湿滑。', ['峡谷']],
        ['鳞隐石林', '永安', '半天', '可与桃源洞连线。', ['石林']],
        ['贡川古镇', '永安', '半天', '古城墙与古桥。', ['古镇']],
      ],
      north: [
        ['将乐玉华洞', '将乐', '半天–一天', '溶洞恒温，备外套。', ['溶洞']],
        ['明溪 / 清流山水选点', '明溪或清流', '一天', '适合小众自然爱好者。', ['山水']],
        ['建宁闽江源（可选）', '建宁', '一天', '车程远，建议过夜。', ['源头', '自然']],
      ],
    },
    food: ['烧麦', '酸菜系列', '笋干菜', '河鲜', '擂茶（适量）'],
    stayTips: ['泰宁适合住 2 晚深游；永安/将乐可作节点住宿。'],
  },
  nanping: {
    name: '南平',
    prefix: 'np',
    areas: {
      wuyi: [
        ['武夷山九曲溪竹筏', '武夷山', '半天', '提前预约，防晒霜。', ['竹筏', '山水']],
        ['天游峰', '武夷山', '半天–一天', '登顶俯瞰九曲，强度高。', ['登山']],
        ['大红袍景区', '武夷山', '半天', '岩茶母树与峡谷。', ['茶文化']],
        ['武夷宫与宋街', '武夷山', '半天', '休整购物节点。', ['古街']],
        ['水帘洞 / 虎啸岩选线', '武夷山', '半天–一天', '挑一条经典徒步线。', ['徒步']],
      ],
      city: [
        ['延平湖滨与市区', '延平', '半天', '高铁中转休整。', ['城市']],
        ['茫荡山', '延平', '一天', '城郊山水，云雾季好看。', ['山景']],
      ],
      outer: [
        ['建瓯千年古街', '建瓯', '半天', '芝城镇风貌。', ['古街']],
        ['邵武和平古镇', '邵武', '一天', '闽北古村落，适合摄影。', ['古镇']],
        ['政和 / 松溪茶山选点', '政和或松溪', '一天', '采茶季更有体验。', ['茶乡']],
        ['顺昌华阳山（可选）', '顺昌', '一天', '徒步爱好者。', ['徒步']],
      ],
    },
    food: ['笋宴', '熏鹅', '岚谷熏鹅', '岩茶茶点', '朱子家宴风味'],
    stayTips: ['武夷山景区门口或度假区住最省时；竹筏务必预约。'],
  },
  longyan: {
    name: '龙岩',
    prefix: 'ly',
    areas: {
      tulou: [
        ['永定土楼王府 / 承启楼一带', '永定', '一天', '土楼博物馆气质，讲解可选。', ['土楼']],
        ['高北土楼群', '永定', '半天–一天', '振成楼等经典。', ['土楼', '摄影']],
        ['洪坑土楼民俗文化村', '永定', '一天', '住土楼体验更深。', ['土楼', '民俗']],
      ],
      city: [
        ['龙岩市区登高亭 / 中山路', '新罗', '半天', '城市补给日。', ['城市']],
        ['龙崆洞', '新罗', '半天', '溶洞消暑。', ['溶洞']],
        ['龙硿洞后绿道散步', '新罗', '半天', '轻松恢复体力。', ['绿道']],
      ],
      west: [
        ['长汀古城', '长汀', '一天', '客家古城墙与店头街。', ['古城', '客家']],
        ['长汀南寨河边', '长汀', '半天', '夜景适合散步。', ['夜景']],
        ['连城冠豸山', '连城', '一天', '丹霞奇峰，登顶有强度。', ['丹霞', '登山']],
        ['培田古民居', '连城', '半天–一天', '明清民居群落。', ['古民居']],
      ],
      nature: [
        ['上杭古田会议旧址', '上杭', '半天', '红色文化线。', ['红色']],
        ['梅花山自然保护区外围', '上杭附近', '一天', '生态观光，听向导建议。', ['生态']],
        ['武平梁野山选点', '武平', '一天', '小众山林。', ['山林']],
      ],
    },
    food: ['白斩河田鸡', '八大干', '芋子包', '客家酿豆腐', '涮九品'],
    stayTips: ['土楼过夜体验佳；长汀/连城适合拆成节点住宿。'],
  },
  ningde: {
    name: '宁德',
    prefix: 'nd',
    areas: {
      coast: [
        ['霞浦北岐 / 东壁滩涂', '霞浦', '半天–一天', '摄影潮汐表必查。', ['滩涂', '摄影']],
        ['霞浦花竹洋 / 杨家溪选点', '霞浦', '半天–一天', '梯田与溪谷，错季也美。', ['梯田', '山水']],
        ['三沙镇海岸', '霞浦', '半天', '渔港氛围。', ['渔港']],
        ['福鼎太姥山', '福鼎', '一天–两天', '花岗岩奇峰，备登山鞋。', ['山海']],
        ['福鼎嵛山岛', '福鼎', '一天–两天', '船票紧张需预约。', ['海岛']],
      ],
      mountain: [
        ['屏南白水洋', '屏南', '一天', '浅水广场，注意防晒与安全。', ['水上', '亲子']],
        ['鸳鸯溪 / 黄瓜山', '屏南', '一天', '可与白水洋连线。', ['峡谷']],
        ['周宁鲤鱼溪 / 九龙漈', '周宁', '一天', '瀑布群与古村落。', ['瀑布', '古村']],
        ['古田临水宫', '古田', '半天', '陈靖姑文化。', ['民俗', '寺庙']],
      ],
      city: [
        ['蕉城三都澳远眺', '蕉城', '半天', '海湾风光。', ['海湾']],
        ['霍童古镇', '蕉城/附近', '半天–一天', '线狮文化与古街。', ['古镇']],
        ['市区美食休整', '蕉城', '半天', '补货休息日。', ['美食']],
      ],
    },
    food: ['海鲜粥', '二都蛄', '福鼎肉片', '芋饺', '鱼糜制品'],
    stayTips: ['霞浦摄影住滩涂附近；太姥山/嵛山建议各自过夜。'],
  },
};

const THEMES = [
  {
    key: 'classic',
    title: (n, days) => `${n}经典${days}日游`,
    theme: '首次标准线',
    summary: (n, days) => `覆盖${n}最有代表性的街区与核心景点，节奏适中，适合第一次来的${days}日行程。`,
    bestFor: '首次到访 · 不想踩雷',
    pick: (c) => ['A', 'B', 'C', 'D', 'A'],
  },
  {
    key: 'foodie',
    title: (n, days) => `${n}美食漫游${days}日`,
    theme: '吃逛结合',
    summary: (n, days) => `以${n}小吃与地方菜为主线，景点做串联，${days}天边走边吃不赶场。`,
    bestFor: '吃货 · 轻松节奏',
    pick: () => ['A', 'B', 'food', 'A', 'B'],
  },
  {
    key: 'family',
    title: (n, days) => `${n}亲子轻松${days}日`,
    theme: '少赶路亲子',
    summary: (n, days) => `强度低、步行可控，预留午睡与室内备选，适合带娃的${days}日。`,
    bestFor: '亲子 · 老人同行',
    pick: () => ['soft', 'B', 'soft', 'C', 'soft'],
  },
  {
    key: 'nature',
    title: (n, days) => `${n}山水自然${days}日`,
    theme: '亲近自然',
    summary: (n, days) => `多安排山海、公园与轻徒步，城市点到为止，适合想透气的${days}日。`,
    bestFor: '自然爱好者',
    pick: () => ['N', 'N', 'C', 'N', 'soft'],
  },
  {
    key: 'culture',
    title: (n, days) => `${n}人文深度${days}日`,
    theme: '文化慢游',
    summary: (n, days) => `寺庙、古街、非遗与博物馆气质景点为主，适合爱逛人文点的${days}日。`,
    bestFor: '文化向 · 摄影',
    pick: () => ['A', 'A', 'C', 'outer', 'A'],
  },
  {
    key: 'photo',
    title: (n, days) => `${n}拍照出片${days}日`,
    theme: '光影旅行',
    summary: (n, days) => `按早晚光安排海岸、古镇与观景台，中午留白咖啡馆，专为出片设计的${days}日。`,
    bestFor: '摄影 · 情侣',
    pick: () => ['photo', 'N', 'A', 'photo', 'soft'],
  },
  {
    key: 'deep',
    title: (n, days) => `${n}深度小众${days}日`,
    theme: '避开人潮',
    summary: (n, days) => `多安排郊县与相对小众点，${days}天把周边也串起来，适合二次来访。`,
    bestFor: '二次到访 · 自驾友好',
    pick: () => ['outer', 'N', 'outer', 'C', 'outer'],
  },
  {
    key: 'slow',
    title: (n, days) => `${n}疗愈慢游${days}日`,
    theme: '留白不赶',
    summary: (n, days) => `每天主打一个区域，下午强制留白，适合想休息充电的${days}日。`,
    bestFor: '疗愈 · 独处',
    pick: () => ['soft', 'soft', 'A', 'soft', 'N'],
  },
];

function flatPools(city) {
  const a = city.areas;
  const keys = Object.keys(a);
  const all = keys.flatMap((k) => a[k].map((sp) => ({ ...toSpot(sp), pool: k })));
  return { keys, all, byKey: a };
}

function toSpot(arr) {
  return { name: arr[0], area: arr[1], duration: arr[2], tip: arr[3], highlights: arr[4] || [] };
}

function pickSpots(city, kind, dayIndex, used) {
  const { all, byKey, keys } = flatPools(city);
  const prefer = {
    A: keys[0],
    B: keys[1] || keys[0],
    C: keys[2] || keys[0],
    N: keys.find((k) => /nature|mountain|west|east|coast|wuyi|tulou|outer|green|south|north/.test(k)) || keys[keys.length - 1],
    outer: keys.find((k) => /outer|west|east|south|north|mountain/.test(k)) || keys[keys.length - 1],
    soft: keys.find((k) => /city|green|relax|oldtown|south|river/.test(k)) || keys[0],
    photo: keys.find((k) => /coast|island|wuyi|tulou|river|south|mountain/.test(k)) || keys[0],
    food: keys[0],
  }[kind] || keys[dayIndex % keys.length];

  const pool = (byKey[prefer] || all).map((x) => (Array.isArray(x) ? toSpot(x) : x));
  const available = pool.filter((sp) => !used.has(sp.name));
  const source = available.length ? available : pool;
  const a = source[dayIndex % source.length];
  const b = source[(dayIndex + 1) % source.length];
  used.add(a.name);
  if (b.name !== a.name) used.add(b.name);

  if (kind === 'food') {
    return [
      { ...a, tip: `${a.tip} 午餐安排地方小吃。` },
      {
        name: `${city.name}美食点名`,
        area: a.area,
        duration: '穿插全天',
        tip: `推荐尝试：${city.food.slice(0, 3).join('、')}。少食多餐。`,
        highlights: ['美食'],
      },
    ];
  }
  if (kind === 'soft') {
    return [
      { ...a, duration: '上午–午后', tip: `${a.tip} 下午强制休息或咖啡馆。` },
      {
        name: '留白时光',
        area: '住宿附近',
        duration: '下午–晚',
        tip: '午睡、散步或商场避暑，不硬塞景点。',
        highlights: ['休息'],
      },
    ];
  }
  return b.name === a.name ? [a] : [a, { ...b, duration: b.duration || '下午' }];
}

function buildDays(city, themeCfg, dayCount) {
  const used = new Set();
  const picks = themeCfg.pick(city);
  const days = [];
  for (let i = 0; i < dayCount; i++) {
    const kind = picks[i % picks.length];
    const spots = pickSpots(city, kind, i, used);
    const meals =
      themeCfg.key === 'foodie'
        ? [`早餐本地小吃`, `午餐打卡 ${city.food[i % city.food.length]}`, `晚餐清淡或海鲜（适量）`]
        : [`早餐酒店/附近`, `午餐景点周边`, `晚餐回城或住宿附近`];
    days.push({
      theme:
        themeCfg.key === 'slow'
          ? `慢节奏 · 第${i + 1}区`
          : themeCfg.key === 'nature'
            ? `自然向 · Day${i + 1}`
            : `行程 Day${i + 1}`,
      spots,
      meals,
    });
  }
  return days;
}

function routeOf(days) {
  return days.map((d, i) => `D${i + 1} ${d.spots[0]?.name || '主区'}`).join(' → ');
}

function tipsFor(city, themeCfg, dayCount) {
  const base = [
    ...city.stayTips,
    `${dayCount} 日行程请预留半天弹性，遇雨改室内或咖啡馆。`,
    '开放时间、船票、索道与票务以官方当日公告为准。',
  ];
  if (themeCfg.key === 'photo') base.push('日出日落点提前查潮汐/天气；无人机遵守空域规定。');
  if (themeCfg.key === 'family') base.push('备好防晒、雨具、应急药品；高强度点可改轻松替代。');
  if (themeCfg.key === 'nature') base.push('穿防滑鞋，带足够饮水；山区早晚温差大。');
  return base;
}

function buildCityPlans(cityId, city) {
  const out = { '3day': [], '4day': [], '5day': [] };
  const dayMap = { '3day': 3, '4day': 4, '5day': 5 };
  const labelMap = { '3day': '三', '4day': '四', '5day': '五' };

  for (const [durId, dayCount] of Object.entries(dayMap)) {
    for (const themeCfg of THEMES) {
      const days = buildDays(city, themeCfg, dayCount);
      const label = labelMap[durId];
      out[durId].push({
        id: `${city.prefix}-${durId}-${themeCfg.key}`,
        title: themeCfg.title(city.name, label),
        theme: themeCfg.theme,
        summary: themeCfg.summary(city.name, label),
        bestFor: themeCfg.bestFor,
        route: routeOf(days),
        days,
        tips: tipsFor(city, themeCfg, dayCount),
      });
    }
  }
  return out;
}

function emitFile(fileName, exportName, cityIds) {
  const lines = [];
  lines.push(`/**`);
  lines.push(` * 福建旅行计划：三日游 / 四日游 / 五日及以上`);
  lines.push(` * 本文件由 scripts/genTravelLongPlans.mjs 生成，每种天数每市 8 条`);
  lines.push(` */`);
  lines.push(`import { multiDay, d, s } from './travelLongHelpers.js';`);
  lines.push('');
  lines.push(`/** @type {Record<string, Record<string, import('./travel.js').Plan[]>>} */`);
  lines.push(`export const ${exportName} = {`);

  for (const cityId of cityIds) {
    const city = CITIES[cityId];
    const plans = buildCityPlans(cityId, city);
    lines.push(`  ${cityId}: {`);
    for (const dur of ['3day', '4day', '5day']) {
      lines.push(`    '${dur}': [`);
      for (const p of plans[dur]) {
        lines.push(`      multiDay(`);
        lines.push(`        ${JSON.stringify(p.id)},`);
        lines.push(`        ${JSON.stringify(p.title)},`);
        lines.push(`        ${JSON.stringify(p.theme)},`);
        lines.push(`        ${JSON.stringify(p.summary)},`);
        lines.push(`        ${JSON.stringify(p.bestFor)},`);
        lines.push(`        ${JSON.stringify(p.route)},`);
        lines.push(`        [`);
        for (const day of p.days) {
          lines.push(`          d(${JSON.stringify(day.theme)}, [`);
          for (const sp of day.spots) {
            lines.push(
              `            s(${JSON.stringify(sp.name)}, ${JSON.stringify(sp.area)}, ${JSON.stringify(sp.duration)}, ${JSON.stringify(sp.tip)}, ${JSON.stringify(sp.highlights)}),`
            );
          }
          lines.push(`          ], ${JSON.stringify(day.meals)}),`);
        }
        lines.push(`        ],`);
        lines.push(`        ${JSON.stringify(p.tips)},`);
        lines.push(`      ),`);
      }
      lines.push(`    ],`);
    }
    lines.push(`  },`);
  }
  lines.push(`};`);
  lines.push('');

  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Wrote', outPath);
}

emitFile('travelLongPlans.js', 'LONG_CITY_TRAVEL_PLANS', [
  'xiamen',
  'fuzhou',
  'quanzhou',
  'zhangzhou',
  'putian',
]);
emitFile('travelLongPlansRest.js', 'LONG_CITY_TRAVEL_PLANS_REST', [
  'sanming',
  'nanping',
  'longyan',
  'ningde',
]);

// fix awkward food string for ningde
console.log('Done. Verify counts with a quick import after wiring travel.js');
