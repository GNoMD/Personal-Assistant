/**
 * Ingredient / dish line → image under /ingredients/*.png
 * Longer / more specific keys first.
 */
const INGREDIENT_VISUALS = [
  { keys: ['总干料'], src: '/ingredients/dry-mix.png', label: '干料' },
  { keys: ['去芯莲子', '莲子'], src: '/ingredients/lotus-seed.png', label: '莲子' },
  { keys: ['干百合', '百合'], src: '/ingredients/lily.png', label: '百合' },
  { keys: ['山药干', '山药'], src: '/ingredients/yam.png', label: '山药' },
  { keys: ['茯苓'], src: '/ingredients/poria.png', label: '茯苓' },
  { keys: ['芡实'], src: '/ingredients/euryale.png', label: '芡实' },
  { keys: ['炒白扁豆', '白扁豆'], src: '/ingredients/hyacinth-bean.png', label: '白扁豆' },
  { keys: ['赤小豆'], src: '/ingredients/adzuki.png', label: '赤小豆' },
  { keys: ['红腰豆'], src: '/ingredients/chickpea.png', label: '红腰豆' },
  { keys: ['鹰嘴豆'], src: '/ingredients/chickpea.png', label: '鹰嘴豆' },
  { keys: ['绿豆'], src: '/ingredients/mung-bean.png', label: '绿豆' },
  { keys: ['黑豆'], src: '/ingredients/soybean.png', label: '黑豆' },
  { keys: ['豆浆', '轻豆浆'], src: '/ingredients/soy-milk.png', label: '豆浆' },
  { keys: ['干黄豆', '黄豆'], src: '/ingredients/soybean.png', label: '黄豆' },
  { keys: ['内酯豆腐', '北豆腐', '豆腐'], src: '/ingredients/tofu.png', label: '豆腐' },
  { keys: ['裸燕麦', '纯燕麦米', '燕麦米', '纯燕麦', '燕麦'], src: '/ingredients/oats.png', label: '燕麦' },
  { keys: ['干荞麦面', '荞麦面', '荞麦'], src: '/ingredients/buckwheat.png', label: '荞麦' },
  { keys: ['藜麦'], src: '/ingredients/quinoa.png', label: '藜麦' },
  { keys: ['黑米', '红米'], src: '/ingredients/brown-rice.png', label: '色米' },
  { keys: ['糙米饭', '糙米', '杂粮饭', '杂粮'], src: '/ingredients/brown-rice.png', label: '糙米杂粮' },
  { keys: ['软米饭', '米饭'], src: '/ingredients/white-rice.png', label: '米饭' },
  { keys: ['小米粥', '杂粮粥', '燕麦粥', '粥'], src: '/ingredients/congee.png', label: '粥' },
  { keys: ['小米'], src: '/ingredients/millet.png', label: '小米' },
  { keys: ['挂面', '龙须面', '面条', '汤面'], src: '/ingredients/noodles.png', label: '面条' },
  { keys: ['粉丝'], src: '/ingredients/vermicelli.png', label: '粉丝' },
  { keys: ['无乳糖低脂牛奶', '低脂牛奶', '低脂奶', '牛奶'], src: '/ingredients/milk.png', label: '牛奶' },
  { keys: ['无乳糖无糖酸奶', '无乳糖原味', '希腊酸奶', '酸奶'], src: '/ingredients/yogurt.png', label: '酸奶' },
  { keys: ['蒸蛋羹', '蛋羹', '蒸蛋', '卧蛋'], src: '/ingredients/steamed-egg.png', label: '蒸蛋' },
  { keys: ['鹌鹑蛋'], src: '/ingredients/quail-egg.png', label: '鹌鹑蛋' },
  { keys: ['茶香蛋', '水煮蛋', '煎蛋', '炒蛋', '鸡蛋'], src: '/ingredients/egg.png', label: '鸡蛋' },
  { keys: ['全麦吐司', '吐司'], src: '/ingredients/toast.png', label: '吐司' },
  { keys: ['全麦面包', '面包'], src: '/ingredients/bread.png', label: '面包' },
  { keys: ['全麦馒头', '馒头'], src: '/ingredients/mantou.png', label: '馒头' },
  { keys: ['全麦卷饼', '全麦薄饼', '卷饼'], src: '/ingredients/wrap.png', label: '卷饼' },
  { keys: ['蓝莓'], src: '/ingredients/blueberry.png', label: '蓝莓' },
  { keys: ['草莓'], src: '/ingredients/strawberry.png', label: '草莓' },
  { keys: ['樱桃番茄'], src: '/ingredients/tomato.png', label: '樱桃番茄' },
  { keys: ['樱桃'], src: '/ingredients/cherry.png', label: '樱桃' },
  { keys: ['苹果'], src: '/ingredients/apple.png', label: '苹果' },
  { keys: ['柠檬'], src: '/ingredients/lemon.png', label: '柠檬' },
  { keys: ['橙子'], src: '/ingredients/orange.png', label: '橙子' },
  { keys: ['奇异果', '猕猴桃'], src: '/ingredients/kiwi.png', label: '猕猴桃' },
  { keys: ['梨'], src: '/ingredients/pear.png', label: '梨' },
  { keys: ['黑芝麻'], src: '/ingredients/chia.png', label: '黑芝麻' },
  { keys: ['核桃仁', '核桃'], src: '/ingredients/walnut.png', label: '核桃' },
  { keys: ['花生'], src: '/ingredients/almond.png', label: '花生' },
  { keys: ['杏仁'], src: '/ingredients/almond.png', label: '杏仁' },
  { keys: ['奇亚籽'], src: '/ingredients/chia.png', label: '奇亚籽' },
  { keys: ['鸡胸肉', '鸡胸', '鸡腿', '鸡肉', '火鸡'], src: '/ingredients/chicken.png', label: '鸡肉' },
  { keys: ['鲈鱼', '龙利鱼', '龙利', '巴沙鱼', '巴沙', '清蒸鱼', '鱼肉', '鱼'], src: '/ingredients/fish.png', label: '鱼' },
  { keys: ['虾仁', '虾'], src: '/ingredients/shrimp.png', label: '虾仁' },
  { keys: ['瘦牛肉', '牛肉丝', '牛肉'], src: '/ingredients/beef.png', label: '牛肉' },
  { keys: ['紫薯'], src: '/ingredients/purple-yam.png', label: '紫薯' },
  { keys: ['土豆泥', '土豆'], src: '/ingredients/potato.png', label: '土豆' },
  { keys: ['甜玉米', '玉米段', '煮玉米', '蒸玉米', '玉米'], src: '/ingredients/corn.png', label: '玉米' },
  { keys: ['西兰花'], src: '/ingredients/broccoli.png', label: '西兰花' },
  { keys: ['木耳'], src: '/ingredients/wood-ear.png', label: '木耳' },
  { keys: ['海带'], src: '/ingredients/kelp.png', label: '海带' },
  { keys: ['茄子'], src: '/ingredients/eggplant.png', label: '茄子' },
  { keys: ['白萝卜', '萝卜丝', '萝卜'], src: '/ingredients/radish.png', label: '萝卜' },
  { keys: ['冬瓜'], src: '/ingredients/winter-melon.png', label: '冬瓜' },
  { keys: ['丝瓜'], src: '/ingredients/luffa.png', label: '丝瓜' },
  { keys: ['芦笋'], src: '/ingredients/asparagus.png', label: '芦笋' },
  { keys: ['西葫芦'], src: '/ingredients/zucchini.png', label: '西葫芦' },
  { keys: ['胡萝卜'], src: '/ingredients/carrot.png', label: '胡萝卜' },
  { keys: ['洋葱'], src: '/ingredients/onion.png', label: '洋葱' },
  { keys: ['豆芽'], src: '/ingredients/sprouts.png', label: '豆芽' },
  { keys: ['紫菜'], src: '/ingredients/nori.png', label: '紫菜' },
  { keys: ['香菇', '杏鲍菇', '金针菇', '菌菇', '蘑菇'], src: '/ingredients/mushroom.png', label: '菌菇' },
  { keys: ['彩椒', '青椒'], src: '/ingredients/pepper.png', label: '彩椒' },
  { keys: ['番茄'], src: '/ingredients/tomato.png', label: '番茄' },
  { keys: ['菜花'], src: '/ingredients/cauliflower.png', label: '菜花' },
  { keys: ['菠菜'], src: '/ingredients/spinach.png', label: '菠菜' },
  { keys: ['油麦菜', '菜心', '大白菜', '白菜', '上海青', '青菜'], src: '/ingredients/bok-choy.png', label: '青菜' },
  { keys: ['生菜', '时蔬', '绿叶'], src: '/ingredients/lettuce.png', label: '生菜' },
  { keys: ['黄瓜'], src: '/ingredients/cucumber.png', label: '黄瓜' },
  { keys: ['枸杞'], src: '/ingredients/goji.png', label: '枸杞' },
  { keys: ['菊花'], src: '/ingredients/chrysanthemum.png', label: '菊花' },
  { keys: ['鲜姜', '姜丝', '姜片', '生姜', '淡姜'], src: '/ingredients/ginger.png', label: '姜' },
  { keys: ['薄荷'], src: '/ingredients/mint.png', label: '薄荷' },
  { keys: ['美式咖啡', '咖啡', '美式'], src: '/ingredients/coffee.png', label: '咖啡' },
  { keys: ['清水', '温水', '温开水', '凉白开', '热水'], src: '/ingredients/water.png', label: '水' },
];

const FALLBACK = { src: '/ingredients/fallback.png', label: '食材' };

export function resolveIngredientVisual(line) {
  const text = String(line || '');
  for (const item of INGREDIENT_VISUALS) {
    if (item.keys.some((key) => text.includes(key))) {
      return { src: item.src, label: item.label };
    }
  }
  return FALLBACK;
}

export function resolveIngredientVisuals(line) {
  const text = String(line || '');
  const parts = text.split(/\+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [resolveIngredientVisual(text)];

  const visuals = parts.map((part) => resolveIngredientVisual(part));
  const unique = [];
  const seen = new Set();
  for (const visual of visuals) {
    if (seen.has(visual.src)) continue;
    seen.add(visual.src);
    unique.push(visual);
  }
  return unique.length ? unique : [FALLBACK];
}
