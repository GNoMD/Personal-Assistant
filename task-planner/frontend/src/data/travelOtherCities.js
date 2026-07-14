/**
 * 福建其余八市旅行计划（半日 / 一日 / 两日）
 * 与厦门数据结构一致，供 travel.js 合并。
 */

export const OTHER_CITY_PLANS = {
  fuzhou: {
    half: [
      {
        id: 'fz-half-sanfang',
        title: '三坊七巷精华半日',
        theme: '古城慢逛',
        summary: '福州名片三坊七巷，半日走完南后街与主要坊巷，适合落地休整或傍晚出行。',
        bestFor: '首次到访 · 步行友好',
        route: '南后街入口 → 衣锦坊 / 文儒坊 → 光禄吟台周边 → 结束',
        spots: [
          {
            name: '南后街',
            area: '鼓楼区',
            duration: '1–1.5 小时',
            tip: '小吃与文创集中，别只拍牌坊，侧巷更安静。',
            highlights: ['鱼丸', '肉燕', '伴手礼'],
          },
          {
            name: '衣锦坊 / 文儒坊',
            area: '三坊七巷',
            duration: '1–1.5 小时',
            tip: '部分故居收费，时间紧可选 1 处深入。',
            highlights: ['明清建筑', '故居'],
          },
          {
            name: '安泰河 / 光禄吟台一带',
            area: '三坊七巷内侧',
            duration: '40 分钟',
            tip: '适合坐下来喝杯茶，消化半日行程。',
            highlights: ['河景', '休息'],
          },
        ],
        meals: ['南后街小吃或附近闽菜简餐'],
        tips: ['周末人多，尽量错峰；穿舒适鞋。', '雨天石板路湿滑，注意防滑。'],
      },
    ],
    '1day': [
      {
        id: 'fz-1day-classic',
        title: '经典一日：三坊七巷 + 上下杭 / 烟台山',
        theme: '古城 + 江景',
        summary: '上午逛三坊七巷，下午去上下杭或烟台山看闽江，晚上可回东街口吃宵夜。',
        bestFor: '第一次来福州',
        route: '三坊七巷（上午）→ 午餐 → 上下杭 / 烟台山（下午）→ 东街口晚餐',
        spots: [
          {
            name: '三坊七巷',
            duration: '3–4 小时',
            tip: '上午光线与人流更友好。',
            highlights: ['南后街', '坊巷'],
          },
          {
            name: '上下杭历史文化街区',
            area: '台江',
            duration: '1.5–2 小时',
            tip: '比三坊七巷安静，适合拍照与咖啡。',
            highlights: ['码头文化', '老街'],
          },
          {
            name: '烟台山（可选）',
            area: '仓山',
            duration: '1–1.5 小时',
            tip: '可远眺闽江，傍晚景色更好。',
            highlights: ['江景', '洋房外景'],
          },
        ],
        meals: ['三坊七巷午餐', '东街口或台江闽菜晚餐'],
        tips: ['两区打车 15–25 分钟；别再硬塞鼓山，一日会赶。', '夏天午后多进室内休息。'],
      },
    ],
    '2day': [
      {
        id: 'fz-2day-city-mountain',
        title: '两日：古城一天 + 鼓山一天',
        theme: '人文与山景',
        summary: '第一天沉浸城区老街，第二天登鼓山呼吸绿意，节奏适合周末短途。',
        bestFor: '周末深度游',
        route: 'D1 三坊七巷+上下杭 → D2 鼓山风景区',
        days: [
          {
            label: '第一天',
            theme: '古城人文',
            spots: [
              { name: '三坊七巷全日', duration: '上午–下午', tip: '可选 1–2 处收费故居。', highlights: ['坊巷', '小吃'] },
              { name: '上下杭夜景或东街口', duration: '晚上', tip: '步行量别太大。', highlights: ['夜市', '闽菜'] },
            ],
            meals: ['南后街午餐', '市区晚餐'],
          },
          {
            label: '第二天',
            theme: '鼓山半日～一日',
            spots: [
              { name: '鼓山风景区', duration: '上午–下午', tip: '可乘索道减负；注意登山强度。', highlights: ['涌泉寺', '山景'] },
              { name: '返程市区 / 高铁站', duration: '傍晚', tip: '预留堵车时间。', highlights: ['返程'] },
            ],
            meals: ['山脚或景区内简餐', '离榕前正餐'],
          },
        ],
        tips: ['住鼓楼/台江方便第一天；鼓山建议早出发。', '雨后山路湿滑，备防滑鞋。'],
      },
    ],
  },

  quanzhou: {
    half: [
      {
        id: 'qz-half-westreet',
        title: '西街 · 开元寺半日',
        theme: '海丝古城',
        summary: '泉州最经典半日：开元寺双塔 + 西街慢逛，感受宋元海丝余韵。',
        bestFor: '首次到访',
        route: '开元寺 → 西街 → 钟楼周边 → 结束',
        spots: [
          {
            name: '开元寺',
            area: '鲤城区',
            duration: '1–1.5 小时',
            tip: '双塔是标志；寺内安静区域更适合拍照。',
            highlights: ['东西塔', '大雄宝殿'],
          },
          {
            name: '西街',
            area: '鲤城区',
            duration: '1.5–2 小时',
            tip: '小吃与文创多，别只走主街。',
            highlights: ['石板路', '咖啡', '伴手礼'],
          },
        ],
        meals: ['西街小吃：面线糊、牛肉羹、嫩饼'],
        tips: ['寺庙着装得体；周末西街拥挤，保管好随身物品。'],
      },
    ],
    '1day': [
      {
        id: 'qz-1day-classic',
        title: '一日海丝：开元寺 · 西街 · 清源山 / 蟳埔',
        theme: '古城 + 山海',
        summary: '上午古城核心，下午二选一：清源山看老君岩，或蟳埔村看簪花围。',
        bestFor: '第一次来泉州',
        route: '开元寺+西街 → 午餐 → 清源山或蟳埔 → 市区晚餐',
        spots: [
          { name: '开元寺 + 西街', duration: '上午 3–4 小时', tip: '先寺后街更顺。', highlights: ['双塔', '老街'] },
          { name: '清源山（方案 A）', duration: '下午 2.5–3.5 小时', tip: '老君岩是重点，量力而行。', highlights: ['老君岩', '山风'] },
          { name: '蟳埔村（方案 B）', duration: '下午 2–3 小时', tip: '尊重当地习俗，勿过度打扰居民。', highlights: ['簪花围', '蚵壳厝'] },
        ],
        meals: ['西街午餐', '市区或蟳埔海鲜晚餐'],
        tips: ['清源山与蟳埔不要同一天硬拼。', '防晒、饮水必备。'],
      },
    ],
    '2day': [
      {
        id: 'qz-2day-hai-si',
        title: '两日海丝：古城 + 清源山 / 蟳埔',
        theme: '不赶路的泉州',
        summary: '第一天吃透古城，第二天山或海二选一加深，适合周末。',
        bestFor: '周末短途',
        route: 'D1 开元寺+西街+街区夜逛 → D2 清源山或蟳埔+返程',
        days: [
          {
            label: '第一天',
            theme: '古城沉浸',
            spots: [
              { name: '开元寺、西街、钟楼一带', duration: '全天', tip: '可加关岳庙或天后宫择一。', highlights: ['海丝遗迹', '小吃'] },
            ],
            meals: ['西街小吃', '鲤城闽南菜'],
          },
          {
            label: '第二天',
            theme: '山或海',
            spots: [
              { name: '清源山 或 蟳埔村', duration: '上午–下午', tip: '二选一即可，留出返程。', highlights: ['老君岩 / 簪花'] },
            ],
            meals: ['当地简餐', '返程前正餐'],
          },
        ],
        tips: ['住宿建议西街/钟楼附近。', '世界遗产点多，开放时间以现场为准。'],
      },
    ],
  },

  zhangzhou: {
    half: [
      {
        id: 'zz-half-dongshan',
        title: '东山岛风陵半日',
        theme: '海岛风光',
        summary: '漳州最出片的半日选择：东山风陵石景区看海蚀奇石与海湾。',
        bestFor: '拍照 · 海边散步',
        route: '风陵石入口 → 海蚀地貌步道 → 海湾观景 → 返程',
        spots: [
          {
            name: '风动石 / 关帝庙一带',
            area: '东山县',
            duration: '1.5–2 小时',
            tip: '防晒要求高，备帽子墨镜。',
            highlights: ['风动石', '海岸'],
          },
          {
            name: '马銮湾或附近沙滩（可选）',
            duration: '1 小时',
            tip: '半日只选一个沙滩点，别跑太散。',
            highlights: ['沙滩', '海风'],
          },
        ],
        meals: ['东山海鲜简餐'],
        tips: ['从漳州市区到东山需较长时间，半日建议人已在东山。', '台风天勿近海。'],
      },
    ],
    '1day': [
      {
        id: 'zz-1day-yunshuiyao',
        title: '一日：云水谣 / 南靖土楼精华',
        theme: '土楼古村',
        summary: '云水谣古道或附近土楼群一日游，适合喜欢古村落与田园感的人。',
        bestFor: '古镇摄影',
        route: '云水谣入口 → 古道徒步 → 土楼参观 → 返程',
        spots: [
          { name: '云水谣古道', duration: '2–3 小时', tip: '竹林与溪流是核心体验。', highlights: ['古道', '竹林'] },
          { name: '怀远楼 / 和贵楼等（择一）', duration: '1–1.5 小时', tip: '听讲解更懂土楼结构。', highlights: ['土楼', '客家文化'] },
        ],
        meals: ['景区内客家菜'],
        tips: ['建议报正规交通或自驾；注意景区票务政策。', '周末人多，尽早入园。'],
      },
    ],
    '2day': [
      {
        id: 'zz-2day-island-tulou',
        title: '两日：东山一天 + 土楼一天',
        theme: '海与楼',
        summary: '一天看海，一天看土楼，漳州最具代表性的组合。',
        bestFor: '周末深度',
        route: 'D1 东山岛 → D2 云水谣/南靖土楼',
        days: [
          {
            label: '第一天',
            theme: '东山海景',
            spots: [
              { name: '风陵石 + 一处海湾', duration: '全天', tip: '强度可控，多留看海时间。', highlights: ['海蚀岩', '沙滩'] },
            ],
            meals: ['东山海鲜'],
          },
          {
            label: '第二天',
            theme: '土楼古村',
            spots: [
              { name: '云水谣或南靖土楼', duration: '全天', tip: '两地车程需规划，建议早出发。', highlights: ['古道', '土楼'] },
            ],
            meals: ['客家菜', '返程简餐'],
          },
        ],
        tips: ['住宿可第一晚东山、第二晚回市区或直接返程。', '两天都偏户外，备防晒雨具。'],
      },
    ],
  },

  putian: {
    half: [
      {
        id: 'pt-half-city',
        title: '莆田市区半日：文献路 / 寺庙文化',
        theme: '妈祖故里入门',
        summary: '若时间只够半天且在市区，可走文献路与主要庙宇，感受莆田香火与市井。',
        bestFor: '过境停留',
        route: '文献路一带 → 主要寺庙择一 → 小吃收尾',
        spots: [
          { name: '文献路 / 市区步行区', duration: '1.5 小时', tip: '适合买伴手礼与感受市井。', highlights: ['步行街', '小吃'] },
          { name: '市区主要寺庙（择一）', duration: '1–1.5 小时', tip: '礼佛着装得体，保持安静。', highlights: ['香火', '建筑'] },
        ],
        meals: ['莆田卤面、兴化米粉'],
        tips: ['真正核心是湄洲岛，有时间优先排岛。'],
      },
    ],
    '1day': [
      {
        id: 'pt-1day-meizhou',
        title: '湄洲岛一日：妈祖祖庙',
        theme: '朝圣与海岸',
        summary: '湄洲岛是莆田必打卡：妈祖祖庙 + 岛上海岸，适合一日往返。',
        bestFor: '文化朝圣 · 看海',
        route: '码头上岛 → 妈祖祖庙 → 黄金沙滩 / 鹅尾神石 → 返程',
        spots: [
          { name: '湄洲妈祖祖庙', duration: '2–3 小时', tip: '核心景区，预留排队与参观时间。', highlights: ['祖庙', '妈祖文化'] },
          { name: '黄金沙滩或鹅尾神石园（择一）', duration: '1.5–2 小时', tip: '半日精力有限时只选一个。', highlights: ['沙滩', '奇石'] },
        ],
        meals: ['岛上海鲜或素斋简餐'],
        tips: ['关注船票与天气；岛上交通以景区车/步行为主。', '防晒与饮水必备。'],
      },
    ],
    '2day': [
      {
        id: 'pt-2day-meizhou',
        title: '两日湄洲：慢岛不赶场',
        theme: '朝圣慢游',
        summary: '在岛上住一晚，把祖庙与海岸拆开两天走，体验更从容。',
        bestFor: '想住海岛',
        route: 'D1 上岛+祖庙 → D2 海岸线+返程',
        days: [
          {
            label: '第一天',
            theme: '祖庙与安顿',
            spots: [
              { name: '上岛、妈祖祖庙', duration: '下午–傍晚', tip: '傍晚香火与光线另有味道。', highlights: ['祖庙'] },
            ],
            meals: ['岛上晚餐'],
          },
          {
            label: '第二天',
            theme: '海岸与返程',
            spots: [
              { name: '沙滩 / 神石园', duration: '上午–中午', tip: '退房后轻装出门。', highlights: ['海岸'] },
              { name: '返市区或高铁', duration: '下午', tip: '预留船班时间。', highlights: ['返程'] },
            ],
            meals: ['岛上午餐', '陆地晚餐'],
          },
        ],
        tips: ['岛上住宿提前订；旺季船票紧张。', '尊重宗教场所规矩。'],
      },
    ],
  },

  sanming: {
    half: [
      {
        id: 'sm-half-city-park',
        title: '三明市区半日：绿地与江景',
        theme: '休闲城市',
        summary: '若暂不远出景区，可在市区沿江与公园散步，适合中转休整。',
        bestFor: '过境休整',
        route: '市区沿江步道 → 城市公园择一 → 结束',
        spots: [
          { name: '沙溪沿江步道', duration: '1–1.5 小时', tip: '傍晚风凉更舒服。', highlights: ['江景', '散步'] },
          { name: '市区公园 / 绿道', duration: '1 小时', tip: '强度低，适合家庭。', highlights: ['绿化', '休息'] },
        ],
        meals: ['市区客家菜或家常菜'],
        tips: ['精华多在泰宁、将乐等县，有整天时间请出城。'],
      },
    ],
    '1day': [
      {
        id: 'sm-1day-taining',
        title: '泰宁大金湖一日精华',
        theme: '丹霞水域',
        summary: '大金湖游船 + 丹霞地貌，是三明最具代表性的一日选择。',
        bestFor: '山水风光',
        route: '赴泰宁 → 大金湖游船 → 岸上观景 → 返程',
        spots: [
          { name: '大金湖游船', duration: '2.5–3.5 小时', tip: '以景区船班为准，注意防暑。', highlights: ['湖景', '丹霞'] },
          { name: '尚书第或城内短停（可选）', duration: '1 小时', tip: '时间够再进，否则直接返程。', highlights: ['古建'] },
        ],
        meals: ['泰宁当地菜'],
        tips: ['市区到泰宁车程不短，建议早出晚归或跟团交通。', '雨雾天观景效果下降。'],
      },
    ],
    '2day': [
      {
        id: 'sm-2day-taining-cave',
        title: '两日：大金湖 + 玉华洞 / 古城',
        theme: '湖光山色',
        summary: '一天湖上丹霞，一天溶洞或古城，覆盖三明经典山水。',
        bestFor: '周末深度',
        route: 'D1 大金湖 → D2 将乐玉华洞或泰宁古城延伸',
        days: [
          {
            label: '第一天',
            theme: '大金湖',
            spots: [{ name: '大金湖景区', duration: '全天', tip: '游船是核心，别排太满岸上项目。', highlights: ['游船', '丹霞'] }],
            meals: ['泰宁餐饮'],
          },
          {
            label: '第二天',
            theme: '溶洞或古城',
            spots: [
              { name: '将乐玉华洞 或 泰宁古城延伸', duration: '半天–一天', tip: '溶洞内温差大，备一件外套。', highlights: ['溶洞 / 古建'] },
            ],
            meals: ['当地简餐', '返程'],
          },
        ],
        tips: ['第一晚住泰宁最省时。', '景区分属不同县，交通需提前规划。'],
      },
    ],
  },

  nanping: {
    half: [
      {
        id: 'np-half-wuyi-entry',
        title: '武夷山半日：印象景点入门',
        theme: '双世遗入门',
        summary: '时间紧张时可走朱子巷 / 市区或景区门口一带休整，真正精华需至少一日。',
        bestFor: '过境 / 傍晚到达',
        route: '景区枢纽 / 三姑一带 → 短途观景 → 住宿休整',
        spots: [
          { name: '三姑度假区 / 景区枢纽', duration: '1–2 小时', tip: '适合安顿行李、买票问路。', highlights: ['补给', '咨询'] },
          { name: '附近观景短停', duration: '1 小时', tip: '半日勿强行九曲溪。', highlights: ['山景外景'] },
        ],
        meals: ['度假区餐饮'],
        tips: ['九曲溪竹筏务必提前预约。', '半日只适合落地日或离开日。'],
      },
    ],
    '1day': [
      {
        id: 'np-1day-wuyi',
        title: '武夷山一日：九曲溪 + 天游',
        theme: '经典山水',
        summary: '上午竹筏漂流九曲溪，下午登天游峰，是武夷山最经典一日组合。',
        bestFor: '第一次来武夷山',
        route: '九曲溪竹筏 → 午餐 → 天游峰 → 返程休整',
        spots: [
          { name: '九曲溪竹筏', duration: '上午约 2 小时（含候筏）', tip: '务必提前订票；听从筏工安排。', highlights: ['竹筏', '丹霞溪谷'] },
          { name: '天游峰', duration: '下午 2–3 小时', tip: '台阶多，量力而行，防暑防滑。', highlights: ['天游', '俯瞰九曲'] },
        ],
        meals: ['景区内或三姑午餐', '度假区晚餐'],
        tips: ['门票+竹筏+交通卡政策常变，以官方为准。', '夏天避开正午强晒登山。'],
      },
    ],
    '2day': [
      {
        id: 'np-2day-wuyi',
        title: '武夷山两日：溪、峰与夜',
        theme: '双世遗深度',
        summary: '一天溪峰经典，一天补充水帘洞或大红袍景区，体验更完整。',
        bestFor: '周末必玩',
        route: 'D1 九曲溪+天游 → D2 水帘洞/茶旅线 → 返程',
        days: [
          {
            label: '第一天',
            theme: '溪与峰',
            spots: [
              { name: '九曲溪竹筏', duration: '上午', tip: '核心体验，优先保障。', highlights: ['竹筏'] },
              { name: '天游峰', duration: '下午', tip: '保留体力，慢慢登。', highlights: ['登山'] },
            ],
            meals: ['景区简餐', '度假区晚餐'],
          },
          {
            label: '第二天',
            theme: '补充线',
            spots: [
              { name: '水帘洞或大红袍景区', duration: '上午–下午', tip: '二选一即可，给返程留白。', highlights: ['岩壁', '茶旅'] },
            ],
            meals: ['当地茶菜', '返程'],
          },
        ],
        tips: ['住三姑/度假区最方便。', '雨天竹筏可能停开，关注通知。'],
      },
    ],
  },

  longyan: {
    half: [
      {
        id: 'ly-half-city',
        title: '龙岩市区半日休整',
        theme: '客家门户',
        summary: '若暂不赴永定/长汀，可在市区散步补给，为土楼行程做准备。',
        bestFor: '中转日',
        route: '市区商圈 / 公园 → 品尝客家小吃 → 休整',
        spots: [
          { name: '市区步行与补给', duration: '1.5–2 小时', tip: '买水、充电宝、防晒。', highlights: ['补给'] },
          { name: '城市公园短憩', duration: '1 小时', tip: '低强度，适合长途车后。', highlights: ['休息'] },
        ],
        meals: ['龙岩花生汤、客家小吃'],
        tips: ['土楼精华在永定、南靖方向，有整天请出城。'],
      },
    ],
    '1day': [
      {
        id: 'ly-1day-tulou',
        title: '永定土楼一日：高北 / 洪坑精华',
        theme: '世界遗产土楼',
        summary: '永定土楼群一日游，重点看承启楼等经典土楼与客家生活。',
        bestFor: '土楼初体验',
        route: '赴永定景区 → 高北或洪坑土楼 → 返程',
        spots: [
          { name: '高北土楼群（承启楼等）', duration: '2.5–3.5 小时', tip: '听讲解更有收获。', highlights: ['承启楼', '客家文化'] },
          { name: '洪坑或附近土楼（可选）', duration: '1.5–2 小时', tip: '时间紧可只走高北。', highlights: ['土楼村落'] },
        ],
        meals: ['客家菜：梅菜扣肉、芋子包'],
        tips: ['景区交通以官方车或正规旅行社为宜。', '尊重居民生活，勿随意闯入民居。'],
      },
    ],
    '2day': [
      {
        id: 'ly-2day-tulou-changting',
        title: '两日：永定土楼 + 长汀古城',
        theme: '土楼与古城',
        summary: '一天土楼，一天长汀古城，覆盖龙岩最具代表性的两条线。',
        bestFor: '周末文化游',
        route: 'D1 永定土楼 → D2 长汀古城 → 返程',
        days: [
          {
            label: '第一天',
            theme: '永定土楼',
            spots: [{ name: '高北 / 洪坑土楼', duration: '全天', tip: '深度走一处胜过赶两处。', highlights: ['土楼'] }],
            meals: ['客家菜'],
          },
          {
            label: '第二天',
            theme: '长汀古城',
            spots: [
              { name: '长汀古城墙、店头街等', duration: '上午–下午', tip: '古城适合慢走，别排太满。', highlights: ['古城', '历史街区'] },
            ],
            meals: ['长汀小吃', '返程'],
          },
        ],
        tips: ['两地有车程，建议第一晚住永定或龙岩枢纽。', '雨天石板路湿滑。'],
      },
    ],
  },

  ningde: {
    half: [
      {
        id: 'nd-half-city-coast',
        title: '宁德市区 / 三都澳观景半日',
        theme: '海湾印象',
        summary: '时间有限时可先看三都澳海湾观景，感受宁德山海气质。',
        bestFor: '过境看海',
        route: '赴观景平台 → 海湾拍照 → 返程',
        spots: [
          { name: '三都澳相关观景平台', duration: '2–3 小时', tip: '具体开放点位以当地最新推荐为准。', highlights: ['海湾', '渔排远景'] },
        ],
        meals: ['市区海鲜简餐'],
        tips: ['精华还包括太姥山、霞浦，有整天请优先安排。'],
      },
    ],
    '1day': [
      {
        id: 'nd-1day-taitoushan',
        title: '太姥山一日精华',
        theme: '山海大观',
        summary: '太姥山是宁德王牌：峰石、隧道与山海视野，适合体能中等的游客。',
        bestFor: '登山观景',
        route: '上山进景区 → 核心峰石线路 → 下山返程',
        spots: [
          { name: '太姥山核心步道', duration: '4–6 小时', tip: '量力选择线路，备水与防滑鞋。', highlights: ['峰石', '山洞', '观景'] },
        ],
        meals: ['山脚或景区简餐'],
        tips: ['早进山早下山；雷雨天慎行。', '部分路段台阶陡，老人小孩需评估体力。'],
      },
    ],
    '2day': [
      {
        id: 'nd-2day-mountain-xiapu',
        title: '两日：太姥山 + 霞浦滩涂',
        theme: '山与滩涂',
        summary: '一天登山，一天霞浦摄影，是宁德最出片的组合。',
        bestFor: '摄影与风光',
        route: 'D1 太姥山 → D2 霞浦滩涂（北岙/小皓等择一）',
        days: [
          {
            label: '第一天',
            theme: '太姥山',
            spots: [{ name: '太姥山一日', duration: '全天', tip: '保留体力，别走最难线。', highlights: ['山海'] }],
            meals: ['山脚餐饮'],
          },
          {
            label: '第二天',
            theme: '霞浦滩涂',
            spots: [
              { name: '霞浦经典滩涂点（择一）', duration: '日出或白天场', tip: '摄影团点位多，跟靠谱向导更高效。', highlights: ['滩涂', '光影'] },
            ],
            meals: ['霞浦海鲜', '返程'],
          },
        ],
        tips: ['潮汐影响出片，出发前查潮汐表。', '第一晚可住福鼎/太姥山脚下，第二晚霞浦或返程。'],
      },
    ],
  },
};
