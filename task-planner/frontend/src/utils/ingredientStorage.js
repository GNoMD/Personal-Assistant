import { resolveIngredientVisual, resolveIngredientVisuals } from './ingredientImages';

/**
 * Storage guidance keyed by ingredient visual labels (see ingredientImages.js).
 * Practical home-kitchen tips — not professional food-safety certification.
 */
const STORAGE_BY_LABEL = {
  干料: {
    place: '阴凉干燥柜',
    temperature: '常温避光',
    shelfLife: '密封约 6–12 个月',
    tips: [
      '分装小密封罐，远离灶台油烟与潮湿',
      '开封后尽快用完；发现结块、霉味或虫蛀即丢弃',
      '取用时用干燥勺子，避免受潮',
    ],
  },
  莲子: {
    place: '密封罐或冰箱',
    temperature: '干货常温；泡发后冷藏',
    shelfLife: '干货约 6–12 个月；泡发后 1–2 天',
    tips: [
      '干莲子密封避潮存放',
      '泡发或煮熟后放密封盒冷藏，尽快食用',
    ],
  },
  百合: {
    place: '密封袋 / 干燥柜',
    temperature: '常温干燥',
    shelfLife: '干百合约 6–12 个月',
    tips: ['密封防潮；受潮后易发霉，勿继续食用'],
  },
  山药: {
    place: '保鲜层或阴凉处',
    temperature: '鲜山药约 5–10℃；干货常温',
    shelfLife: '鲜山药约 1–2 周；干货约半年',
    tips: [
      '鲜山药别堆放出汗；切口用保鲜膜包好',
      '去皮后若暂存，可泡淡盐水再冷藏，当天用完',
    ],
  },
  茯苓: {
    place: '密封干燥',
    temperature: '常温',
    shelfLife: '约 12 个月',
    tips: ['密封避光防潮；开封后注意检查结块与异味'],
  },
  芡实: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 6–12 个月',
    tips: ['干货密封防潮；煮熟后冷藏尽快食用'],
  },
  白扁豆: {
    place: '密封干燥柜',
    temperature: '常温',
    shelfLife: '约 12 个月',
    tips: ['豆类密封防虫防潮；水浸泡后冷藏，1 天内用完'],
  },
  赤小豆: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 12 个月',
    tips: ['密封防潮防虫；夏季可冷藏存放更稳'],
  },
  红腰豆: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '干豆约 12 个月；罐头开罐后 2–3 天',
    tips: ['干豆密封保存；罐头/熟豆开封后倒入饭盒冷藏'],
  },
  鹰嘴豆: {
    place: '密封罐或冷藏',
    temperature: '干豆常温；熟豆冷藏',
    shelfLife: '干豆约 12 个月；熟豆 3–4 天',
    tips: ['熟鹰嘴豆密封冷藏，也可分装冷冻约 1 个月'],
  },
  绿豆: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 12 个月',
    tips: ['密封防潮；发芽或煮熟后冷藏尽快食用'],
  },
  黑豆: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 12 个月',
    tips: ['密封避光；浸泡后冷藏当天用完'],
  },
  黄豆: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 6–12 个月',
    tips: ['干黄豆密封防潮；泡开后冷藏，24 小时内打豆浆或烹饪'],
  },
  豆浆: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '自制冷藏当日；盒装按包装',
    tips: [
      '自制豆浆冷却后密封冷藏，最好当天饮用',
      '盒装开封后尽快喝完，勿常温久放',
      '疑似胀袋、异味勿饮用',
    ],
  },
  豆腐: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '开封后 1–2 天',
    tips: [
      '未开封按包装冷藏；开封后换清水浸没、每日换水或密封盒冷藏',
      '表面发黏、有酸味即丢弃',
    ],
  },
  燕麦: {
    place: '密封罐 / 干燥柜',
    temperature: '常温；暑期可冷藏',
    shelfLife: '开封后约 2–3 个月',
    tips: ['开封后密封防潮防氧化；闻起来哈喇味勿食用'],
  },
  荞麦: {
    place: '密封干燥',
    temperature: '常温',
    shelfLife: '干面约 6–12 个月；煮熟冷藏 1–2 天',
    tips: ['干面密封防潮；煮熟后分装冷藏尽快食用'],
  },
  藜麦: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 6–12 个月',
    tips: ['密封防潮；煮熟后冷藏 2–3 天'],
  },
  色米: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 3–6 个月',
    tips: ['红米黑米油脂略高，暑期建议冷藏密封'],
  },
  糙米杂粮: {
    place: '密封罐或冷藏',
    temperature: '常温干燥；暑期冷藏更稳',
    shelfLife: '约 3–6 个月',
    tips: ['杂粮易回潮生虫，密封并少囤；熟饭冷藏当日或次日加热食用'],
  },
  米饭: {
    place: '冰箱保鲜层 / 冷冻',
    temperature: '熟饭冷藏或冷冻',
    shelfLife: '冷藏当日–次日；冷冻约 1 个月',
    tips: [
      '趁热分装摊凉后尽快入冰箱，勿室温久放',
      '复热至热透；异味或发黏勿食用',
    ],
  },
  粥: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '冷藏当日–次日',
    tips: ['放凉密封冷藏，复热充分翻匀加热'],
  },
  小米: {
    place: '密封罐',
    temperature: '常温干燥',
    shelfLife: '约 3–6 个月',
    tips: ['小米易哈败，少囤、密封；暑期可冷藏'],
  },
  面条: {
    place: '干燥柜或冷藏',
    temperature: '干面常温；鲜湿面冷藏',
    shelfLife: '干面按包装；鲜面开封后尽快',
    tips: ['干面密封防潮；煮熟后冷藏 1 天内食用'],
  },
  粉丝: {
    place: '密封干燥',
    temperature: '常温',
    shelfLife: '按包装，通常约 12 个月',
    tips: ['开封后扎紧袋口；泡发后冷藏当天用完'],
  },
  牛奶: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '开封后 2–3 天（以包装为准）',
    tips: [
      '未开封按包装保存；开封后竖放冷藏并盖紧',
      '别放冰箱门；倒出的不要再倒回纸盒',
    ],
  },
  酸奶: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '开封后 1–2 天',
    tips: ['未开封看保质期；开封后密封冷藏，出现稀水分层过剧、异味勿食用'],
  },
  蒸蛋: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '冷藏当日',
    tips: ['熟蛋羹冷却后密封冷藏，当日复热食用'],
  },
  鹌鹑蛋: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '生蛋约 1–2 周；熟蛋 2–3 天',
    tips: ['生蛋放蛋格冷藏；煮熟晾凉密封冷藏'],
  },
  鸡蛋: {
    place: '冰箱保鲜层 / 蛋格',
    temperature: '0–4℃',
    shelfLife: '冷藏约 2–4 周',
    tips: [
      '尖头朝下、大头朝上放置更稳',
      '别清洗后久存（清洗会破坏保护膜）',
      '煮熟蛋冷藏 4–5 天内食用',
    ],
  },
  吐司: {
    place: '密封袋 / 冷冻',
    temperature: '短期常温阴凉；长期冷冻',
    shelfLife: '常温 2–3 天；冷冻约 1 个月',
    tips: ['开封后尽快吃完；要久放可切片冷冻，食用前复烤'],
  },
  面包: {
    place: '密封袋 / 冷冻',
    temperature: '阴凉干燥或冷冻',
    shelfLife: '常温 1–3 天；冷冻约 1 个月',
    tips: ['避开高温潮湿；长霉必须丢弃，不可只切除霉斑'],
  },
  馒头: {
    place: '冰箱或冷冻',
    temperature: '冷藏 / 冷冻',
    shelfLife: '冷藏 2–3 天；冷冻约 1 个月',
    tips: ['放凉密封；复热蒸透或微波加水覆盖'],
  },
  卷饼: {
    place: '冷藏或冷冻',
    temperature: '冷藏 / 冷冻',
    shelfLife: '冷藏 2–3 天；冷冻约 1 个月',
    tips: ['密封防干；冷冻分层纸隔开以免粘连'],
  },
  蓝莓: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '约 3–5 天',
    tips: ['勿提前水洗；干燥透气盒存放，吃前再洗；也可速冻'],
  },
  草莓: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '约 1–3 天',
    tips: ['别堆压；潮湿易烂，吃前再洗；软烂果及时挑出'],
  },
  樱桃番茄: {
    place: '阴凉处或保鲜层',
    temperature: '常温或冷藏',
    shelfLife: '约 3–7 天',
    tips: ['未全熟可常温后熟；已熟透冷藏并尽早食用'],
  },
  樱桃: {
    place: '冰箱保鲜层',
    temperature: '0–4℃',
    shelfLife: '约 3–5 天',
    tips: ['保持干燥；吃前再冲洗'],
  },
  苹果: {
    place: '阴凉处或保鲜层',
    temperature: '常温或冷藏',
    shelfLife: '冷藏约 2–4 周',
    tips: ['与绿叶菜分开放（乙烯会催熟其他蔬果）；切开冷藏当日吃完'],
  },
  柠檬: {
    place: '冰箱保鲜层',
    temperature: '冷藏',
    shelfLife: '整颗约 2–3 周；切片 2–3 天',
    tips: ['整颗冷藏；切片可密封或冷冻备用'],
  },
  橙子: {
    place: '阴凉通风或冷藏',
    temperature: '常温或冷藏',
    shelfLife: '约 1–2 周',
    tips: ['表皮发霉的整颗丢弃；切开后密封冷藏当日食用'],
  },
  猕猴桃: {
    place: '按成熟度存放',
    temperature: '硬果常温；软熟冷藏',
    shelfLife: '硬果催熟数日；软熟冷藏 3–5 天',
    tips: ['要加快软化可与苹果同袋；已软尽快食用'],
  },
  梨: {
    place: '保鲜层或阴凉处',
    temperature: '冷藏更耐放',
    shelfLife: '冷藏约 1–2 周',
    tips: ['避免碰伤；成熟后尽快食用'],
  },
  黑芝麻: {
    place: '密封罐，暑期冷藏',
    temperature: '常温干燥或冷藏',
    shelfLife: '开封后约 1–3 个月',
    tips: ['油脂易氧化，密封避光；有哈喇味丢弃'],
  },
  核桃: {
    place: '密封冷藏或冷冻',
    temperature: '冷藏 / 冷冻',
    shelfLife: '冷藏约 1–2 个月；冷冻更久',
    tips: ['仁类易哈败，少囤密封；不开封可短期阴凉存放'],
  },
  花生: {
    place: '密封干燥或冷藏',
    temperature: '阴凉干燥',
    shelfLife: '开封后约 1 个月',
    tips: ['防潮防霉；霉变花生不可食用'],
  },
  杏仁: {
    place: '密封冷藏',
    temperature: '冷藏更稳',
    shelfLife: '开封后约 1–2 个月',
    tips: ['密封避光；哈喇味丢弃'],
  },
  奇亚籽: {
    place: '密封罐',
    temperature: '常温阴凉',
    shelfLife: '约 12 个月',
    tips: ['密封防潮；泡开后冷藏当日食用'],
  },
  鸡肉: {
    place: '冰箱冷藏 / 冷冻',
    temperature: '冷藏 0–4℃；长期 -18℃',
    shelfLife: '冷藏 1–2 天；冷冻约 1–2 个月',
    tips: [
      '生肉密封放下层，避免汁水污染其他食物',
      '解冻放冷藏自然化，勿反复冻化',
      '熟鸡肉冷藏 2–3 天内食用，复热充分',
    ],
  },
  鱼: {
    place: '冰箱冷藏 / 冷冻',
    temperature: '冷藏 0–4℃；长期冷冻',
    shelfLife: '冷藏当日–次日；冷冻约 1 个月',
    tips: [
      '新鲜鱼当日烹饪最佳；擦干密封冷藏',
      '解冻后勿再次冷冻生鱼',
    ],
  },
  虾仁: {
    place: '冷冻或冷藏',
    temperature: '冷藏短暂；长期冷冻',
    shelfLife: '冷藏当日；冷冻约 1 个月',
    tips: ['鲜虾尽快处理；解冻后当日烹饪，勿反复冻化'],
  },
  牛肉: {
    place: '冷藏下层 / 冷冻',
    temperature: '冷藏 0–4℃；长期冷冻',
    shelfLife: '冷藏 1–2 天；冷冻约 1–2 个月',
    tips: ['整块比绞肉更耐放；绞肉优先当天用完'],
  },
  紫薯: {
    place: '阴凉通风',
    temperature: '常温阴凉，勿冷冻生薯',
    shelfLife: '约 1–2 周',
    tips: ['避光防潮；熟紫薯冷藏 2–3 天'],
  },
  土豆: {
    place: '阴凉干燥通风',
    temperature: '常温阴凉（勿放冰箱长期）',
    shelfLife: '约 2–4 周',
    tips: [
      '远离洋葱单独存放；见光会变绿，发芽严重或变绿部位应丢弃',
      '切开后泡清水可短暂防氧化，尽快烹饪',
    ],
  },
  玉米: {
    place: '带皮冷藏或冷冻',
    temperature: '冷藏 / 冷冻',
    shelfLife: '鲜玉米冷藏 2–3 天；冷冻更久',
    tips: ['鲜玉米尽快吃；煮熟玉米冷藏 2 天内'],
  },
  西兰花: {
    place: '冰箱保鲜袋',
    temperature: '0–4℃',
    shelfLife: '约 3–5 天',
    tips: ['松散包装留透气；变黄软烂及时处理；焯水后可冷冻备餐'],
  },
  木耳: {
    place: '干货密封；泡发冷藏',
    temperature: '干货常温；泡发后冷藏',
    shelfLife: '干货约 12 个月；泡发后当日–次日',
    tips: ['泡发木耳务必冷藏且尽快吃完，勿室温久泡'],
  },
  海带: {
    place: '干货密封；湿品冷藏',
    temperature: '干货常温；泡发后冷藏',
    shelfLife: '干货约 12 个月；泡发后 2–3 天',
    tips: ['泡发海带密封冷藏；盐渍品种按包装处理'],
  },
  茄子: {
    place: '阴凉处或保鲜层',
    temperature: '约 10℃ 为佳，也可靠冷藏短存',
    shelfLife: '约 3–5 天',
    tips: ['怕冷伤，别紧贴后壁久放；表皮皱了尽快烹饪'],
  },
  萝卜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 1–2 周',
    tips: ['叶子易蔫，根茎可单独装袋；切开密封冷藏数日'],
  },
  冬瓜: {
    place: '阴凉处或冷藏',
    temperature: '整颗阴凉；切块冷藏',
    shelfLife: '整颗约 1–2 周；切块 2–3 天',
    tips: ['切口保鲜膜包裹后冷藏'],
  },
  丝瓜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 2–4 天',
    tips: ['易软化，尽快食用；别与催熟水果紧挨'],
  },
  芦笋: {
    place: '保鲜层直立冷藏',
    temperature: '0–4℃',
    shelfLife: '约 2–4 天',
    tips: ['湿纸巾包裹茎部或立在少量清水中再套袋'],
  },
  西葫芦: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 4–7 天',
    tips: ['别洗后存放；表面干燥装袋'],
  },
  胡萝卜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 1–3 周',
    tips: ['去叶后再存更耐放；切开密封冷藏'],
  },
  洋葱: {
    place: '阴凉干燥通风',
    temperature: '常温（切块冷藏）',
    shelfLife: '整颗约数周；切开 3–4 天',
    tips: ['远离土豆；切开密封冷藏'],
  },
  豆芽: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 1–2 天',
    tips: ['极不耐放，购回尽快烹饪；发黏异味丢弃'],
  },
  紫菜: {
    place: '密封干燥',
    temperature: '常温避潮',
    shelfLife: '开封后约 1–2 个月',
    tips: ['吸潮易返软，开封后尽快用完并可冷藏密封'],
  },
  菌菇: {
    place: '保鲜纸袋冷藏',
    temperature: '0–4℃',
    shelfLife: '约 3–5 天',
    tips: ['别密封闷湿；忌提早水洗；变黏发臭丢弃'],
  },
  彩椒: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 4–7 天',
    tips: ['干燥装袋；切开去籽后密封冷藏'],
  },
  番茄: {
    place: '按成熟度',
    temperature: '未熟常温；成熟冷藏',
    shelfLife: '约 3–7 天',
    tips: ['未全熟放室温更香；切开后冷藏当日食用'],
  },
  菜花: {
    place: '保鲜袋冷藏',
    temperature: '冷藏',
    shelfLife: '约 3–5 天',
    tips: ['变褐软烂去除；焯水后可冷冻备餐'],
  },
  菠菜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 2–3 天',
    tips: ['垫厨房纸吸湿；蔫软尽快烹饪'],
  },
  青菜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 2–4 天',
    tips: ['松散包裹；别压底部；洗后沥干再存'],
  },
  生菜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 2–4 天',
    tips: ['清洗沥干后垫纸密封；外层烂叶及时摘除'],
  },
  黄瓜: {
    place: '保鲜层',
    temperature: '冷藏',
    shelfLife: '约 4–7 天',
    tips: ['避免冻伤；切开密封当日–次日食用'],
  },
  枸杞: {
    place: '密封避光',
    temperature: '常温干燥或冷藏',
    shelfLife: '约 6–12 个月',
    tips: ['吸潮易黏结，密封保存'],
  },
  菊花: {
    place: '密封避光干燥',
    temperature: '常温',
    shelfLife: '约 12 个月',
    tips: ['防潮防串味；受潮结块勿用'],
  },
  姜: {
    place: '阴凉处或冷藏',
    temperature: '常温通风或冷藏',
    shelfLife: '约 2–3 周',
    tips: ['可埋干沙/厨房纸巾包裹；切片可冷冻'],
  },
  薄荷: {
    place: '保鲜层或插水',
    temperature: '冷藏',
    shelfLife: '约 2–4 天',
    tips: ['茎浸少量清水冷藏，或湿纸巾包裹'],
  },
  咖啡: {
    place: '密封避光',
    temperature: '常温干燥；开封可冷藏',
    shelfLife: '按包装；开封后尽快',
    tips: ['粉剂密封防潮；冲泡后勿久放，冷藏当日饮用'],
  },
  水: {
    place: '清洁容器',
    temperature: '常温或冷藏',
    shelfLife: '开封饮用水当日建议饮完',
    tips: ['凉白开密封室温可当日；疑似异味更换'],
  },
  食材: {
    place: '按包装与类别',
    temperature: '生鲜优先冷藏；干货密封干燥',
    shelfLife: '以包装保质期为准，开封后尽快食用',
    tips: [
      '生熟分开，熟食密封冷藏',
      '发现霉变、胀袋、异味立即丢弃',
      '不确定时以「少囤、早吃完」为原则',
    ],
  },
};

function tipForLabel(label) {
  return STORAGE_BY_LABEL[label] || STORAGE_BY_LABEL['食材'];
}

/**
 * Resolve storage guidance for an ingredient / dish line.
 * Multi-part lines (a + b) return multiple sections.
 */
export function resolveIngredientStorage(line) {
  const text = String(line || '').trim();
  if (!text) return [];

  const visuals = resolveIngredientVisuals(text);
  const sections = [];
  const seen = new Set();

  for (const visual of visuals) {
    const label = visual.label || '食材';
    if (seen.has(label)) continue;
    seen.add(label);
    const tip = tipForLabel(label);
    sections.push({
      name: label,
      matchedFrom: text,
      image: visual.src,
      ...tip,
    });
  }

  if (!sections.length) {
    const fallback = resolveIngredientVisual(text);
    sections.push({
      name: fallback.label,
      matchedFrom: text,
      image: fallback.src,
      ...tipForLabel(fallback.label),
    });
  }

  return sections;
}
