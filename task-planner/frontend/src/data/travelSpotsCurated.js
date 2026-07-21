/**
 * 全国主线精选景点（非福建；福建由行程抽取）
 * @typedef {{ id: string, name: string, provinceId: string, cityId: string, area?: string, duration?: string, tip?: string, highlights?: string[] }} CatalogSpot
 */

/** @type {CatalogSpot[]} */
export const CURATED_TRAVEL_SPOTS = [
  // —— 广东 ——
  { id: 'gd-chaozhou-ancient', name: '潮州古城', provinceId: 'guangdong', cityId: 'chaozhou', area: '湘桥区', duration: '半天', tip: '牌坊街与广济桥经典线，傍晚人少更好拍。', highlights: ['牌坊街', '广济桥'] },
  { id: 'gd-shantou-queshi', name: '礐石风景区', provinceId: 'guangdong', cityId: 'shantou', area: '濠江', duration: '2–3 小时', tip: '看海湾与老城区天际线，适合短停。', highlights: ['海湾', '夜景'] },
  { id: 'gd-huizhou-xunliao', name: '巽寮湾', provinceId: 'guangdong', cityId: 'huizhou', area: '惠东', duration: '半天–1 天', tip: '海滩散步即可，暑期防晒与停车提前规划。', highlights: ['海滩'] },
  { id: 'gd-shenzhen-window', name: '世界之窗 / 欢乐海岸一带', provinceId: 'guangdong', cityId: 'shenzhen', area: '南山区', duration: '半天', tip: '深圳景点可地铁到达，少开车更省心。', highlights: ['都市', '夜景'] },
  { id: 'gd-shenzhen-dameisha', name: '大梅沙', provinceId: 'guangdong', cityId: 'shenzhen', area: '盐田', duration: '半天', tip: '海边短驳，周末人多早去。', highlights: ['海滨'] },
  { id: 'gd-guangzhou-canton-tower', name: '广州塔与珠江夜游', provinceId: 'guangdong', cityId: 'guangzhou', area: '海珠/天河', duration: '傍晚–夜', tip: '夜景经典；停车难，建议地铁。', highlights: ['夜景', '珠江'] },
  { id: 'gd-guangzhou-chenclan', name: '陈家祠', provinceId: 'guangdong', cityId: 'guangzhou', area: '荔湾', duration: '1.5–2 小时', tip: '岭南建筑精华，可顺路逛上下九。', highlights: ['建筑', '岭南'] },
  { id: 'gd-shaoguan-danxia', name: '丹霞山', provinceId: 'guangdong', cityId: 'shaoguan', area: '仁化', duration: '1 天', tip: '山路费电，住景区外能充电的酒店。', highlights: ['丹霞地貌'] },
  { id: 'gd-qingyuan-huangteng', name: '黄腾峡', provinceId: 'guangdong', cityId: 'qingyuan', area: '清城区', duration: '半天', tip: '漂流季节人多，工作日更舒服。', highlights: ['峡谷', '漂流'] },

  // —— 广西 ——
  { id: 'gx-guilin-li-river', name: '漓江精华段', provinceId: 'guangxi', cityId: 'guilin', area: '阳朔方向', duration: '半天', tip: '船票与码头提前查；雨雾天景致不同。', highlights: ['漓江', '喀斯特'] },
  { id: 'gx-guilin-elephant', name: '象鼻山', provinceId: 'guangxi', cityId: 'guilin', area: '市区', duration: '1 小时', tip: '市区短打卡，可傍晚去。', highlights: ['地标'] },
  { id: 'gx-yangshuo-west-street', name: '西街与遇龙河', provinceId: 'guangxi', cityId: 'yangshuo', area: '阳朔县城', duration: '1 天', tip: '住能充电民宿；骑行遇龙河注意电量。', highlights: ['西街', '遇龙河'] },
  { id: 'gx-nanning-qingxiu', name: '青秀山', provinceId: 'guangxi', cityId: 'nanning', area: '青秀区', duration: '半天', tip: '都市绿肺，适合路过南宁休整。', highlights: ['公园'] },
  { id: 'gx-beihai-silver-beach', name: '银滩', provinceId: 'guangxi', cityId: 'beihai', area: '银海区', duration: '半天', tip: '看海短停即可，防晒必备。', highlights: ['海滩'] },

  // —— 海南 ——
  { id: 'hi-haikou-qilou', name: '骑楼老街', provinceId: 'hainan', cityId: 'haikou', area: '龙华', duration: '2–3 小时', tip: '过海后第一站，傍晚光线好。', highlights: ['骑楼', '小吃'] },
  { id: 'hi-wenchang-coconut', name: '东郊椰林', provinceId: 'hainan', cityId: 'wenchang', area: '东郊', duration: '半天', tip: '东线过路点，椰林海岸散步。', highlights: ['椰林', '海岸'] },
  { id: 'hi-qionghai-boao', name: '博鳌亚洲论坛永久会址一带', provinceId: 'hainan', cityId: 'qionghai', area: '博鳌', duration: '2 小时', tip: '短停打卡，注意开放区域。', highlights: ['博鳌'] },
  { id: 'hi-wanning-riyuewan', name: '日月湾', provinceId: 'hainan', cityId: 'wanning', area: '日月湾', duration: '半天', tip: '冲浪胜地，非玩家也可看海。', highlights: ['海湾'] },
  { id: 'hi-sanya-tianya', name: '天涯海角', provinceId: 'hainan', cityId: 'sanya', area: '天涯区', duration: '半天', tip: '经典但人多，可改去海棠/亚龙看海。', highlights: ['海岸'] },
  { id: 'hi-sanya-yalong', name: '亚龙湾', provinceId: 'hainan', cityId: 'sanya', area: '吉阳', duration: '半天–1 天', tip: '水质较好，住酒店过夜充方便。', highlights: ['海滩'] },
  { id: 'hi-lingshui-fenjiezhou', name: '分界洲岛', provinceId: 'hainan', cityId: 'lingshui', area: '新村港', duration: '1 天', tip: '需船票，看风浪再决定是否出海。', highlights: ['海岛'] },

  // —— 浙江 ——
  { id: 'zj-hangzhou-westlake', name: '西湖', provinceId: 'zhejiang', cityId: 'hangzhou', area: '西湖区', duration: '半天–1 天', tip: '环湖步行或骑行；停车难建议地铁+步行。', highlights: ['西湖', '断桥'] },
  { id: 'zj-hangzhou-lingyin', name: '灵隐寺', provinceId: 'zhejiang', cityId: 'hangzhou', area: '西湖区', duration: '2–3 小时', tip: '进寺需预约时段，避开节假日早高峰。', highlights: ['寺庙'] },
  { id: 'zj-shaoxing-lulan', name: '鲁迅故里与仓桥直街', provinceId: 'zhejiang', cityId: 'shaoxing', area: '越城', duration: '半天', tip: '水乡步行友好，少开车。', highlights: ['故里', '水乡'] },
  { id: 'zj-ningbo-tianyi', name: '天一阁', provinceId: 'zhejiang', cityId: 'ningbo', area: '海曙', duration: '2 小时', tip: '藏书楼经典，可顺路老外滩。', highlights: ['书院'] },
  { id: 'zj-zhoushan-putuo', name: '普陀山', provinceId: 'zhejiang', cityId: 'zhoushan', area: '普陀', duration: '1 天', tip: '过桥/轮渡注意大风；岛上电瓶车为主。', highlights: ['海岛', '寺庙'] },
  { id: 'zj-jinhua-hengdian', name: '横店影视城', provinceId: 'zhejiang', cityId: 'jinhua', area: '东阳', duration: '1–2 天', tip: '景区大，选 2～3 个门区即可。', highlights: ['影视城'] },
  { id: 'zj-lishui-yunhe', name: '云和梯田', provinceId: 'zhejiang', cityId: 'lishui', area: '云和', duration: '半天', tip: '看云海选季节，山路预留电量。', highlights: ['梯田'] },

  // —— 上海 ——
  { id: 'sh-shanghai-bund', name: '外滩', provinceId: 'shanghai', cityId: 'shanghai', area: '黄浦', duration: '1–2 小时', tip: '夜景最佳；地铁到达，勿开车进核心区。', highlights: ['夜景', '黄浦江'] },
  { id: 'sh-shanghai-yu-garden', name: '豫园与城隍庙', provinceId: 'shanghai', cityId: 'shanghai', area: '黄浦', duration: '2–3 小时', tip: '人流大，随身物品看管好。', highlights: ['园林', '小吃'] },
  { id: 'sh-qingpu-zhujiajiao', name: '朱家角', provinceId: 'shanghai', cityId: 'qingpu', area: '青浦', duration: '半天', tip: '水乡短驳，可自驾到外围停车。', highlights: ['古镇'] },
  { id: 'sh-chongming-dongtan', name: '东滩湿地', provinceId: 'shanghai', cityId: 'chongming', area: '崇明', duration: '半天', tip: '观鸟季节更佳，注意开放区域。', highlights: ['湿地'] },

  // —— 江苏 ——
  { id: 'js-suzhou-humble', name: '拙政园', provinceId: 'jiangsu', cityId: 'suzhou', area: '姑苏', duration: '2–3 小时', tip: '需预约；可搭配平江路步行。', highlights: ['园林'] },
  { id: 'js-suzhou-pingjiang', name: '平江路', provinceId: 'jiangsu', cityId: 'suzhou', area: '姑苏', duration: '2 小时', tip: '傍晚更有味道，少开车。', highlights: ['古街'] },
  { id: 'js-wuxi-tai-hu', name: '鼋头渚', provinceId: 'jiangsu', cityId: 'wuxi', area: '滨湖', duration: '半天', tip: '樱花季人极多，错峰。', highlights: ['太湖'] },
  { id: 'js-nanjing-zijin', name: '中山陵与紫金山', provinceId: 'jiangsu', cityId: 'nanjing', area: '玄武', duration: '半天', tip: '景区摆渡，停车紧张。', highlights: ['中山陵'] },
  { id: 'js-nanjing-confucius', name: '夫子庙秦淮', provinceId: 'jiangsu', cityId: 'nanjing', area: '秦淮', duration: '傍晚–夜', tip: '夜游秦淮经典，地铁更方便。', highlights: ['秦淮河'] },
  { id: 'js-yangzhou-slender', name: '瘦西湖', provinceId: 'jiangsu', cityId: 'yangzhou', area: '邗江', duration: '半天', tip: '园林水面线，春日最宜。', highlights: ['园林'] },
  { id: 'js-zhenjiang-jinshan', name: '金山寺', provinceId: 'jiangsu', cityId: 'zhenjiang', area: '润州', duration: '2 小时', tip: '可与西津渡组合半天。', highlights: ['寺庙'] },
  { id: 'js-changzhou-dinosaur', name: '中华恐龙园', provinceId: 'jiangsu', cityId: 'changzhou', area: '新北', duration: '1 天', tip: '亲子向，一日足够。', highlights: ['主题园'] },

  // —— 安徽 ——
  { id: 'ah-huangshan-summit', name: '黄山风景区', provinceId: 'anhui', cityId: 'huangshan', area: '黄山风景区', duration: '1–2 天', tip: '山路费电，住山下屯溪充电；上山看索道时刻。', highlights: ['山岳', '云海'] },
  { id: 'ah-huangshan-hongcun', name: '宏村', provinceId: 'anhui', cityId: 'huangshan', area: '黟县', duration: '半天', tip: '与黄山搭配，古村落步行。', highlights: ['古村'] },
  { id: 'ah-hefei-baohe', name: '包公园与淮河路', provinceId: 'anhui', cityId: 'hefei', area: '庐阳', duration: '半天', tip: '省会休整点，超充方便。', highlights: ['都市'] },
  { id: 'ah-wuhu-fantawild', name: '方特旅游区', provinceId: 'anhui', cityId: 'wuhu', area: '鸠江', duration: '1 天', tip: '主题乐园，选一园即可。', highlights: ['乐园'] },

  // —— 江西 ——
  { id: 'jx-wuyuan-rape', name: '江岭 / 篁岭', provinceId: 'jiangxi', cityId: 'wuyuan', area: '婺源县', duration: '1 天', tip: '油菜花季最热；住县城过夜充。', highlights: ['梯田', '古村'] },
  { id: 'jx-jingdezhen-taoyang', name: '陶阳里 / 御窑', provinceId: 'jiangxi', cityId: 'jingdezhen', area: '珠山', duration: '半天', tip: '瓷器主题，可逛陶溪川。', highlights: ['陶瓷'] },
  { id: 'jx-jiujiang-lushan', name: '庐山', provinceId: 'jiangxi', cityId: 'jiujiang', area: '庐山市', duration: '1 天', tip: '山上温度低，山路预留电量。', highlights: ['山岳'] },
  { id: 'jx-nanchang-tengwang', name: '滕王阁', provinceId: 'jiangxi', cityId: 'nanchang', area: '东湖', duration: '2 小时', tip: '收尾补电城市地标。', highlights: ['楼阁'] },

  // —— 湖南 ——
  { id: 'hn-changsha-orange', name: '橘子洲与岳麓山', provinceId: 'hunan', cityId: 'changsha', area: '岳麓', duration: '半天', tip: '地铁友好；橘子洲可步行/观光车。', highlights: ['湘江'] },
  { id: 'hn-yueyang-tower', name: '岳阳楼', provinceId: 'hunan', cityId: 'yueyang', area: '岳阳楼区', duration: '2 小时', tip: '洞庭湖边短停。', highlights: ['名楼'] },
  { id: 'hn-zjj-wulingyuan', name: '武陵源核心景区', provinceId: 'hunan', cityId: 'zhangjiajie', area: '武陵源', duration: '1–2 天', tip: '山路与索道，住武陵源充电酒店。', highlights: ['峰林'] },
  { id: 'hn-fenghuang-ancient', name: '凤凰古城', provinceId: 'hunan', cityId: 'fenghuang', area: '沱江', duration: '1 天', tip: '夜景人多，住古城外可停车充电。', highlights: ['古城'] },

  // —— 湖北 ——
  { id: 'hb-wuhan-yellow-crane', name: '黄鹤楼', provinceId: 'hubei', cityId: 'wuhan', area: '武昌', duration: '2 小时', tip: '需预约；可搭配长江大桥景观。', highlights: ['名楼'] },
  { id: 'hb-wuhan-east-lake', name: '东湖绿道', provinceId: 'hubei', cityId: 'wuhan', area: '武昌/洪山', duration: '半天', tip: '骑行友好，都市休整。', highlights: ['绿道'] },
  { id: 'hb-yichang-three-gorges', name: '三峡大坝 / 三峡人家选一', provinceId: 'hubei', cityId: 'yichang', area: '夷陵', duration: '1 天', tip: '景区距离远，当天往返算好电量。', highlights: ['三峡'] },
  { id: 'hb-enshi-grand-canyon', name: '恩施大峡谷', provinceId: 'hubei', cityId: 'enshi', area: '恩施市', duration: '1 天', tip: '较疏桩，经验不足可跳过。', highlights: ['峡谷'] },

  // —— 河南 ——
  { id: 'ha-zhengzhou-erqi', name: '二七纪念塔与德化街', provinceId: 'henan', cityId: 'zhengzhou', area: '二七', duration: '2 小时', tip: '枢纽城市短打卡。', highlights: ['都市'] },
  { id: 'ha-kaifeng-qingming', name: '清明上河园', provinceId: 'henan', cityId: 'kaifeng', area: '龙亭', duration: '半天', tip: '夜场表演另计时。', highlights: ['宋文化'] },
  { id: 'ha-luoyang-longmen', name: '龙门石窟', provinceId: 'henan', cityId: 'luoyang', area: '洛龙', duration: '半天', tip: '预约门票；夏季防晒。', highlights: ['石窟'] },
  { id: 'ha-dengfeng-shaolin', name: '少林寺', provinceId: 'henan', cityId: 'dengfeng', area: '登封', duration: '半天', tip: '可与嵩山搭配，山路留意电量。', highlights: ['少林'] },

  // —— 山东 ——
  { id: 'sd-jinan-baotu', name: '趵突泉与大明湖', provinceId: 'shandong', cityId: 'jinan', area: '历下', duration: '半天', tip: '泉水主题，市区步行友好。', highlights: ['泉水'] },
  { id: 'sd-taian-taishan', name: '泰山', provinceId: 'shandong', cityId: 'taian', area: '泰山区', duration: '1 天', tip: '住泰安充好再上山；可索道。', highlights: ['五岳'] },
  { id: 'sd-qingdao-zhanqiao', name: '栈桥与八大关', provinceId: 'shandong', cityId: 'qingdao', area: '市南', duration: '半天', tip: '海风天续航略降。', highlights: ['海滨', '德式建筑'] },
  { id: 'sd-yantai-penglai', name: '蓬莱阁', provinceId: 'shandong', cityId: 'yantai', area: '蓬莱', duration: '半天', tip: '半岛线经典。', highlights: ['海阁'] },
  { id: 'sd-weihai-liugong', name: '刘公岛', provinceId: 'shandong', cityId: 'weihai', area: '环翠', duration: '半天', tip: '需轮渡，看海况。', highlights: ['海岛'] },

  // —— 北京 ——
  { id: 'bj-beijing-forbidden', name: '故宫', provinceId: 'beijing', cityId: 'beijing', area: '东城', duration: '半天', tip: '必须预约；城区地铁，不开车。', highlights: ['故宫'] },
  { id: 'bj-beijing-great-wall', name: '八达岭 / 慕田峪长城选一', provinceId: 'beijing', cityId: 'beijing', area: '延庆/怀柔', duration: '1 天', tip: '可从城区公共交通；自驾查停车与进京政策。', highlights: ['长城'] },
  { id: 'bj-beijing-summer', name: '颐和园', provinceId: 'beijing', cityId: 'beijing', area: '海淀', duration: '半天', tip: '昆明湖环线，春秋最佳。', highlights: ['皇家园林'] },
  { id: 'bj-huairou-mutianyu', name: '慕田峪长城', provinceId: 'beijing', cityId: 'huairou', area: '怀柔', duration: '半天', tip: '相对八达岭人少一些。', highlights: ['长城'] },
  { id: 'bj-miyun-gubei', name: '古北水镇', provinceId: 'beijing', cityId: 'miyun', area: '密云', duration: '1 天', tip: '夜景好看，住镇内或外围充电。', highlights: ['古镇', '长城'] },
  { id: 'bj-yanqing-badaling', name: '八达岭长城', provinceId: 'beijing', cityId: 'yanqing', area: '延庆', duration: '半天', tip: '最经典段，节假日极挤。', highlights: ['长城'] },

  // —— 天津 ——
  { id: 'tj-tianjin-italian', name: '意式风情区', provinceId: 'tianjin', cityId: 'tianjin', area: '河北区', duration: '2–3 小时', tip: '短停打卡，住能充电酒店。', highlights: ['风情街'] },
  { id: 'tj-tianjin-eye', name: '天津之眼', provinceId: 'tianjin', cityId: 'tianjin', area: '红桥', duration: '1–2 小时', tip: '夜景摩天轮，可地铁。', highlights: ['夜景'] },
  { id: 'tj-binhai-aircraft', name: '航母主题公园', provinceId: 'tianjin', cityId: 'binhai', area: '滨海', duration: '半天', tip: '距离市区远，当天往返算里程。', highlights: ['主题'] },

  // —— 河北 ——
  { id: 'he-qhd-beidaihe', name: '北戴河', provinceId: 'hebei', cityId: 'qinhuangdao', area: '北戴河', duration: '半天–1 天', tip: '海滨避暑，夏季人多。', highlights: ['海滨'] },
  { id: 'he-chengde-mountain', name: '避暑山庄', provinceId: 'hebei', cityId: 'chengde', area: '双桥', duration: '半天–1 天', tip: '园子大，选重点区域。', highlights: ['皇家园林'] },
  { id: 'he-sjz-zhengding', name: '正定古城', provinceId: 'hebei', cityId: 'zhengding', area: '正定县', duration: '半天', tip: '可作石家庄收尾。', highlights: ['古城'] },
  { id: 'he-sjz-libo', name: '正定隆兴寺', provinceId: 'hebei', cityId: 'shijiazhuang', area: '正定', duration: '2 小时', tip: '与正定古城同线。', highlights: ['寺庙'] },

  // —— 山西 ——
  { id: 'sx-datong-yungang', name: '云冈石窟', provinceId: 'shanxi', cityId: 'datong', area: '云冈', duration: '半天', tip: '世界遗产，提前预约。', highlights: ['石窟'] },
  { id: 'sx-pingyao-ancient', name: '平遥古城', provinceId: 'shanxi', cityId: 'pingyao', area: '古城内', duration: '1 天', tip: '城内住店可过夜；停车在城外。', highlights: ['古城'] },
  { id: 'sx-taiyuan-jinci', name: '晋祠', provinceId: 'shanxi', cityId: 'taiyuan', area: '晋源', duration: '半天', tip: '太原经典园林。', highlights: ['园林'] },
  { id: 'sx-taiyuan-fenhe', name: '汾河公园', provinceId: 'shanxi', cityId: 'taiyuan', area: '市区', duration: '2 小时', tip: '都市休整散步。', highlights: ['公园'] },

  // —— 辽宁 ——
  { id: 'ln-shenyang-palace', name: '沈阳故宫', provinceId: 'liaoning', cityId: 'shenyang', area: '沈河', duration: '2–3 小时', tip: '夏秋更宜；注意预约。', highlights: ['故宫'] },
  { id: 'ln-dalian-xinghai', name: '星海广场与滨海路', provinceId: 'liaoning', cityId: 'dalian', area: '沙河口', duration: '半天', tip: '海风天续航留意。', highlights: ['海滨'] },
  { id: 'ln-dandong-yalu', name: '鸭绿江断桥', provinceId: 'liaoning', cityId: 'dandong', area: '振兴', duration: '2 小时', tip: '边境短停，政策以现场为准。', highlights: ['边境'] },

  // —— 吉林 ——
  { id: 'jl-changchun-puppet', name: '伪满皇宫', provinceId: 'jilin', cityId: 'changchun', area: '宽城', duration: '2–3 小时', tip: '历史主题，市区友好。', highlights: ['博物'] },
  { id: 'jl-jilin-songhua', name: '松花江雾凇观景（季节）', provinceId: 'jilin', cityId: 'jilin-city', area: '丰满', duration: '半天', tip: '雾凇季才值得专程；冬季续航差。', highlights: ['雾凇'] },
  { id: 'jl-cbs-north', name: '长白山北坡', provinceId: 'jilin', cityId: 'changbaishan', area: '二道白河', duration: '1 天', tip: '天气多变，住二道白河过夜充。', highlights: ['天池'] },

  // —— 黑龙江 ——
  { id: 'hl-harbin-central', name: '中央大街与索菲亚教堂', provinceId: 'heilongjiang', cityId: 'harbin', area: '道里', duration: '半天', tip: '夏秋优先；冰雪大世界另季。', highlights: ['俄式风情'] },
  { id: 'hl-harbin-sun-island', name: '太阳岛', provinceId: 'heilongjiang', cityId: 'harbin', area: '松北', duration: '半天', tip: '夏季散步，冬季雪博可看。', highlights: ['江岛'] },
  { id: 'hl-mudanjiang-jingpo', name: '镜泊湖', provinceId: 'heilongjiang', cityId: 'mudanjiang', area: '宁安', duration: '1 天', tip: '距离远，算好往返电量。', highlights: ['湖泊'] },
  { id: 'hl-mohe-arctic', name: '北极村', provinceId: 'heilongjiang', cityId: 'mohe', area: '漠河', duration: '1–2 天', tip: '极疏桩，仅有经验再上。', highlights: ['北极'] },

  // —— 重庆 ——
  { id: 'cq-chongqing-hongyadong', name: '洪崖洞与解放碑', provinceId: 'chongqing', cityId: 'chongqing', area: '渝中', duration: '傍晚–夜', tip: '山城坡道费电，市区少开车。', highlights: ['夜景'] },
  { id: 'cq-chongqing-ciqikou', name: '磁器口', provinceId: 'chongqing', cityId: 'chongqing', area: '沙坪坝', duration: '半天', tip: '古镇小吃，人多早去。', highlights: ['古镇'] },
  { id: 'cq-wulong-tiankeng', name: '武隆天生三桥', provinceId: 'chongqing', cityId: 'wulong', area: '仙女山', duration: '1 天', tip: '往返算电，住仙女山或回重庆充。', highlights: ['喀斯特'] },
  { id: 'cq-youyang-taohuayuan', name: '桃花源', provinceId: 'chongqing', cityId: 'youyang', area: '酉阳', duration: '半天', tip: '与武隆二选一即可。', highlights: ['山水'] },

  // —— 四川 ——
  { id: 'sc-chengdu-kuanzhai', name: '宽窄巷子与锦里', provinceId: 'sichuan', cityId: 'chengdu', area: '青羊/武侯', duration: '半天', tip: '市区地铁；作川西出发枢纽。', highlights: ['街区'] },
  { id: 'sc-chengdu-panda', name: '大熊猫繁育研究基地', provinceId: 'sichuan', cityId: 'chengdu', area: '成华', duration: '半天', tip: '早去看熊猫活跃；预约。', highlights: ['熊猫'] },
  { id: 'sc-leshan-buddha', name: '乐山大佛', provinceId: 'sichuan', cityId: 'leshan', area: '市中区', duration: '半天', tip: '可与峨眉同线两天。', highlights: ['大佛'] },
  { id: 'sc-emei-mountain', name: '峨眉山', provinceId: 'sichuan', cityId: 'emeishan', area: '峨眉山市', duration: '1–2 天', tip: '山路费电，住山下充。', highlights: ['佛教名山'] },
  { id: 'sc-jiuzhai-valley', name: '九寨沟', provinceId: 'sichuan', cityId: 'jiuzhaigou', area: '阿坝', duration: '1–2 天', tip: '疏桩+海拔，按日限额里程。', highlights: ['彩池'] },
  { id: 'sc-kangding-mugecuo', name: '木格措', provinceId: 'sichuan', cityId: 'kangding', area: '康定', duration: '1 天', tip: '川西入口，高反留意。', highlights: ['高原湖'] },
  { id: 'sc-litang-town', name: '理塘天空之城', provinceId: 'sichuan', cityId: 'litang', area: '理塘', duration: '半天', tip: '高海拔疏桩，经验足够再上。', highlights: ['高原'] },

  // —— 贵州 ——
  { id: 'gz-guiyang-jiaxiu', name: '甲秀楼与青云路', provinceId: 'guizhou', cityId: 'guiyang', area: '南明', duration: '2 小时', tip: '省会休整与补电。', highlights: ['地标'] },
  { id: 'gz-anshun-huangguoshu', name: '黄果树瀑布', provinceId: 'guizhou', cityId: 'anshun', area: '镇宁', duration: '1 天', tip: '雨季水量大；景区摆渡。', highlights: ['瀑布'] },
  { id: 'gz-kaili-xijiang', name: '西江千户苗寨', provinceId: 'guizhou', cityId: 'kaili', area: '雷山', duration: '1 天', tip: '夜景好看，乡镇桩少白天走。', highlights: ['苗寨'] },
  { id: 'gz-zhenyuan-ancient', name: '镇远古城', provinceId: 'guizhou', cityId: 'zhenyuan', area: '镇远县', duration: '半天–1 天', tip: '黔东南水乡感。', highlights: ['古城'] },

  // —— 云南 ——
  { id: 'yn-kunming-dianchi', name: '滇池与西山', provinceId: 'yunnan', cityId: 'kunming', area: '西山', duration: '半天', tip: '春城枢纽，可补电休整。', highlights: ['高原湖'] },
  { id: 'yn-dali-oldtown', name: '大理古城与洱海', provinceId: 'yunnan', cityId: 'dali', area: '大理市', duration: '1–2 天', tip: '环洱海注意电量与停车。', highlights: ['古城', '洱海'] },
  { id: 'yn-lijiang-oldtown', name: '丽江古城与玉龙雪山', provinceId: 'yunnan', cityId: 'lijiang', area: '古城区', duration: '1–2 天', tip: '古城步行；雪山另算一天与高反。', highlights: ['古城', '雪山'] },
  { id: 'yn-shangri-la-songzanlin', name: '松赞林寺', provinceId: 'yunnan', cityId: 'shangri-la', area: '香格里拉', duration: '半天', tip: '海拔高，慢活动。', highlights: ['寺庙'] },
  { id: 'yn-tengchong-volcano', name: '热海与火山地质公园', provinceId: 'yunnan', cityId: 'tengchong', area: '腾冲', duration: '1 天', tip: '与香格里拉二选一。', highlights: ['火山', '温泉'] },

  // —— 陕西 ——
  { id: 'sn-xian-terracotta', name: '兵马俑', provinceId: 'shaanxi', cityId: 'xian', area: '临潼', duration: '半天', tip: '预约；可地铁/旅游专线，少开车进景区。', highlights: ['兵马俑'] },
  { id: 'sn-xian-wall', name: '西安城墙与回民街', provinceId: 'shaanxi', cityId: 'xian', area: '碑林/莲湖', duration: '半天', tip: '西北密桩大城，进河西前休整。', highlights: ['城墙'] },
  { id: 'sn-huashan', name: '华山', provinceId: 'shaanxi', cityId: 'huashan', area: '华阴', duration: '1 天', tip: '住华阴充好再上；索道可减负。', highlights: ['五岳'] },
  { id: 'sn-yanan-pagoda', name: '宝塔山', provinceId: 'shaanxi', cityId: 'yanan', area: '宝塔区', duration: '半天', tip: '红色主题短停。', highlights: ['地标'] },

  // —— 宁夏 ——
  { id: 'nx-yinchuan-western-xia', name: '西夏陵', provinceId: 'ningxia', cityId: 'yinchuan', area: '西夏区', duration: '半天', tip: '戈壁感，防晒与补水。', highlights: ['陵园'] },
  { id: 'nx-zhongwei-shapotou', name: '沙坡头', provinceId: 'ningxia', cityId: 'zhongwei', area: '沙坡头区', duration: '半天–1 天', tip: '白天去、回中卫过夜充。', highlights: ['沙漠', '黄河'] },

  // —— 甘肃 ——
  { id: 'gs-lanzhou-zhongshan', name: '中山桥与黄河风情线', provinceId: 'gansu', cityId: 'lanzhou', area: '城关', duration: '2 小时', tip: '河西走廊起点休整。', highlights: ['黄河'] },
  { id: 'gs-zhangye-danxia', name: '七彩丹霞', provinceId: 'gansu', cityId: 'zhangye', area: '临泽', duration: '半天', tip: '日落光影最好；城际距离长。', highlights: ['丹霞'] },
  { id: 'gs-jiayuguan-pass', name: '嘉峪关关城', provinceId: 'gansu', cityId: 'jiayuguan', area: '嘉峪关市', duration: '半天', tip: '长城西端经典。', highlights: ['关城'] },
  { id: 'gs-dunhuang-mogao', name: '莫高窟', provinceId: 'gansu', cityId: 'dunhuang', area: '莫高窟', duration: '半天', tip: '必须预约；可搭配鸣沙山。', highlights: ['石窟'] },
  { id: 'gs-dunhuang-mingsha', name: '鸣沙山月牙泉', provinceId: 'gansu', cityId: 'dunhuang', area: '市区南', duration: '半天', tip: '日落骑骆驼人多，早去或傍晚。', highlights: ['沙漠'] },

  // —— 青海 ——
  { id: 'qh-xining-dongguan', name: '东关清真大寺与中心广场', provinceId: 'qinghai', cityId: 'xining', area: '城东', duration: '2 小时', tip: '进藏/环湖前休整，注意高反起步。', highlights: ['都市'] },
  { id: 'qh-qinghai-lake', name: '青海湖二郎剑 / 黑马河选段', provinceId: 'qinghai', cityId: 'qinghai-lake', area: '环湖', duration: '1 天', tip: '续航打七折；勿贪全环。', highlights: ['圣湖'] },
  { id: 'qh-chaka-salt', name: '茶卡盐湖', provinceId: 'qinghai', cityId: 'chaka', area: '乌兰', duration: '半天', tip: '与祁连二选一；反光强戴墨镜。', highlights: ['盐湖'] },
  { id: 'qh-qilian-zhuoer', name: '卓尔山', provinceId: 'qinghai', cityId: 'qilian', area: '祁连县', duration: '半天', tip: '网红山，高反慢走。', highlights: ['丹霞山'] },

  // —— 内蒙古 ——
  { id: 'nm-hohhot-zhao', name: '大召寺与塞上老街', provinceId: 'neimenggu', cityId: 'hohhot', area: '回民区', duration: '半天', tip: '呼包鄂起点。', highlights: ['寺庙'] },
  { id: 'nm-baotou-wudangzhao', name: '五当召', provinceId: 'neimenggu', cityId: 'baotou', area: '石拐', duration: '半天', tip: '藏传寺庙，城郊距离留意。', highlights: ['寺庙'] },
  { id: 'nm-ordos-xiangshawan', name: '响沙湾', provinceId: 'neimenggu', cityId: 'ordos', area: '达拉特', duration: '1 天', tip: '沙漠景区，住景区或鄂尔多斯充。', highlights: ['沙漠'] },
  { id: 'nm-alxa-heilan', name: '巴丹吉林 / 弱水金沙选一', provinceId: 'neimenggu', cityId: 'alxa', area: '阿拉善', duration: '1–2 天', tip: '极度疏桩，仅点到为止或跳过。', highlights: ['沙漠', '疏桩'] },

  // —— 新疆 ——
  { id: 'xj-urumqi-tianshan', name: '天山天池', provinceId: 'xinjiang', cityId: 'urumqi', area: '阜康', duration: '1 天', tip: '北疆起点，可当天往返乌市。', highlights: ['天池'] },
  { id: 'xj-urumqi-grand-bazaar', name: '国际大巴扎', provinceId: 'xinjiang', cityId: 'urumqi', area: '天山区', duration: '2 小时', tip: '夜景与美食，休整补电。', highlights: ['巴扎'] },
  { id: 'xj-sayram-lake', name: '赛里木湖', provinceId: 'xinjiang', cityId: 'sayram', area: '博州', duration: '半天–1 天', tip: '环湖路段美，疏桩白天走。', highlights: ['高山湖'] },
  { id: 'xj-yining-lavender', name: '伊宁六星街与喀赞其', provinceId: 'xinjiang', cityId: 'yining', area: '伊宁市', duration: '半天', tip: '伊犁河谷休整点。', highlights: ['街区'] },
  { id: 'xj-nalati-grassland', name: '那拉提空中草原', provinceId: 'xinjiang', cityId: 'nalati', area: '新源', duration: '1 天', tip: '景区大，住那拉提或附近县城。', highlights: ['草原'] },
  { id: 'xj-burqin-colorful', name: '五彩滩', provinceId: 'xinjiang', cityId: 'burqin', area: '布尔津', duration: '2 小时', tip: '喀纳斯前站，日落好看。', highlights: ['雅丹'] },
  { id: 'xj-kanas-lake', name: '喀纳斯湖与禾木', provinceId: 'xinjiang', cityId: 'kanas', area: '布尔津县', duration: '2–3 天', tip: '北疆高潮；进山班车为主，住禾木/贾登峪。', highlights: ['湖景', '村落'] },

  // —— 西藏 ——
  { id: 'xz-lhasa-potala', name: '布达拉宫', provinceId: 'xizang', cityId: 'lhasa', area: '城关', duration: '半天', tip: '必须预约；高反第一天少活动。', highlights: ['宫殿'] },
  { id: 'xz-lhasa-jokhang', name: '大昭寺与八廓街', provinceId: 'xizang', cityId: 'lhasa', area: '城关', duration: '半天', tip: '步行转经，适应高原。', highlights: ['寺庙', '古城'] },
  { id: 'xz-nyingchi-namjagbarwa', name: '雅鲁藏布大峡谷观景', provinceId: 'xizang', cityId: 'nyingchi', area: '林芝', duration: '1 天', tip: '相对低海拔，适合适应后前往。', highlights: ['峡谷'] },
  { id: 'xz-shigatse-tashilhunpo', name: '扎什伦布寺', provinceId: 'xizang', cityId: 'shigatse', area: '桑珠孜', duration: '半天', tip: '日喀则主线；珠峰另评估。', highlights: ['寺庙'] },
  { id: 'xz-everest-base', name: '珠峰大本营', provinceId: 'xizang', cityId: 'everest', area: '定日', duration: '1–2 天', tip: '高反+路况+救援，慎选；电车须查当年条件。', highlights: ['珠峰', '高风险'] },
];
