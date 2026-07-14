import { resolveIngredientVisual } from './ingredientImages';

const MEAL_DEFAULTS = {
  早餐: { src: '/ingredients/oats.png', label: '早餐' },
  午餐: { src: '/ingredients/brown-rice.png', label: '午餐' },
  晚餐: { src: '/ingredients/congee.png', label: '晚餐' },
  加餐: { src: '/ingredients/blueberry.png', label: '加餐' },
  饮品: { src: '/ingredients/soy-milk.png', label: '饮品' },
};

/** Title-first rules so cover matches the dish name, not a random side ingredient. */
const TITLE_COVER_RULES = [
  { keys: ['柠檬'], src: '/ingredients/lemon.png', label: '柠檬' },
  { keys: ['黄瓜薄荷', '黄瓜'], src: '/ingredients/cucumber.png', label: '黄瓜' },
  { keys: ['菊花'], src: '/ingredients/chrysanthemum.png', label: '花茶' },
  { keys: ['枸杞'], src: '/ingredients/goji.png', label: '枸杞' },
  { keys: ['咖啡', '美式'], src: '/ingredients/coffee.png', label: '咖啡' },
  { keys: ['番茄温饮', '番茄'], src: '/ingredients/tomato.png', label: '番茄' },
  { keys: ['苹果'], src: '/ingredients/apple.png', label: '苹果' },
  { keys: ['淡姜', '生姜', '姜'], src: '/ingredients/ginger.png', label: '姜' },
  { keys: ['豆浆', '绿豆百合轻豆浆', '黄豆浆'], src: '/ingredients/soy-milk.png', label: '豆浆' },
  { keys: ['酸奶昔', '莓果', '酸奶'], src: '/ingredients/yogurt.png', label: '酸奶' },
  { keys: ['无乳糖奶燕麦', '燕麦轻饮', '隔夜燕麦'], src: '/ingredients/oats.png', label: '燕麦' },
  { keys: ['莲子百合', '山药茯苓', '无豆温饮', '安神温饮'], src: '/ingredients/lotus-seed.png', label: '谷物温饮' },
  { keys: ['鲈鱼', '龙利', '巴沙', '清蒸鱼'], src: '/ingredients/fish.png', label: '鱼' },
  { keys: ['虾仁'], src: '/ingredients/shrimp.png', label: '虾仁' },
  { keys: ['牛肉'], src: '/ingredients/beef.png', label: '牛肉' },
  { keys: ['鸡胸', '鸡腿', '鸡肉', '火鸡', '鸡丝'], src: '/ingredients/chicken.png', label: '鸡肉' },
  { keys: ['豆腐蛋羹', '蒸蛋', '蛋羹'], src: '/ingredients/steamed-egg.png', label: '蒸蛋' },
  { keys: ['豆腐'], src: '/ingredients/tofu.png', label: '豆腐' },
  { keys: ['双蛋', '水煮蛋', '鸡蛋土豆', '鸡蛋'], src: '/ingredients/egg.png', label: '鸡蛋' },
  { keys: ['紫薯'], src: '/ingredients/purple-yam.png', label: '紫薯' },
  { keys: ['土豆'], src: '/ingredients/potato.png', label: '土豆' },
  { keys: ['玉米'], src: '/ingredients/corn.png', label: '玉米' },
  { keys: ['藜麦'], src: '/ingredients/quinoa.png', label: '藜麦' },
  { keys: ['荞麦'], src: '/ingredients/buckwheat.png', label: '荞麦' },
  { keys: ['菌菇'], src: '/ingredients/mushroom.png', label: '菌菇' },
  { keys: ['芦笋'], src: '/ingredients/asparagus.png', label: '芦笋' },
  { keys: ['杂粮粥', '鸡丝蔬菜粥', '小米粥', '粥'], src: '/ingredients/congee.png', label: '粥' },
  { keys: ['糙米', '杂粮', '汤饭'], src: '/ingredients/brown-rice.png', label: '糙米' },
  { keys: ['全麦卷', '卷饼'], src: '/ingredients/wrap.png', label: '卷饼' },
  { keys: ['吐司', '沙拉午餐'], src: '/ingredients/toast.png', label: '吐司' },
  { keys: ['蓝莓'], src: '/ingredients/blueberry.png', label: '蓝莓' },
  { keys: ['猕猴桃'], src: '/ingredients/kiwi.png', label: '猕猴桃' },
  { keys: ['火锅'], src: '/ingredients/tofu.png', label: '清汤火锅' },
  { keys: ['白扁豆'], src: '/ingredients/hyacinth-bean.png', label: '白扁豆' },
  { keys: ['赤小豆'], src: '/ingredients/adzuki.png', label: '赤小豆' },
  { keys: ['鹰嘴豆'], src: '/ingredients/chickpea.png', label: '鹰嘴豆' },
  { keys: ['绿豆'], src: '/ingredients/mung-bean.png', label: '绿豆' },
  { keys: ['芡实'], src: '/ingredients/euryale.png', label: '芡实' },
  { keys: ['四神'], src: '/ingredients/yam.png', label: '四神' },
];

const SKIP_LINE_RE = /清水|温水|温开水|凉白开|热水|生抽|香油|橄榄油|黑胡椒|肉桂|调味|油脂|汤底|清汤|昆布|少许/;

function matchTitleCover(title) {
  const text = String(title || '');
  for (const rule of TITLE_COVER_RULES) {
    if (rule.keys.some((key) => text.includes(key))) {
      return { src: rule.src, label: rule.label };
    }
  }
  return null;
}

function extractMatchText(line) {
  const text = String(line || '').trim();
  const parts = text.split(/[｜|]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2 && /主食|蛋白|蔬菜|汤品|汤底|水果|调味|加餐|饮品|油脂|干料|谷物|配料|坚果/.test(parts[0])) {
    return parts[1];
  }
  return text;
}

function linePriority(line) {
  const text = String(line || '');
  if (!text || SKIP_LINE_RE.test(text)) return -1;
  if (/^蛋白｜|^蛋白\|/.test(text)) return 300;
  if (/^干料｜|^干料\|/.test(text)) return 280;
  if (/^主食｜|^主食\|/.test(text)) return 200;
  if (/^水果｜|^水果\|/.test(text)) return 160;
  if (/^蔬菜｜|^蔬菜\|/.test(text)) return 120;
  if (/^谷物｜|^谷物\|/.test(text)) return 140;
  if (/^饮品｜|^饮品\|/.test(text)) return 80;
  // breakfast plain lines: protein-ish first
  if (/鸡胸|鸡腿|鸡肉|鱼|虾|牛肉|鸡蛋|蛋羹|酸奶|牛奶|豆腐/.test(text)) return 250;
  if (/燕麦|荞麦|紫薯|土豆|糙米|杂粮|吐司|面包|卷饼|馒头/.test(text)) return 180;
  if (/蓝莓|草莓|苹果|柠檬|猕猴桃|橙子/.test(text)) return 150;
  return 50;
}

/**
 * Cover image for recipe card / detail hero.
 * Prefer title match, then highest-priority ingredient line.
 */
export function resolveRecipeCover(recipe) {
  const fromTitle = matchTitleCover(recipe?.title);
  if (fromTitle) return fromTitle;

  const lines = String(recipe?.ingredients || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let best = null;
  let bestScore = -1;
  for (const line of lines) {
    const score = linePriority(line);
    if (score < 0) continue;
    const visual = resolveIngredientVisual(extractMatchText(line));
    if (!visual || visual.src.includes('fallback') || visual.src.includes('water.png')) continue;
    if (score > bestScore) {
      best = visual;
      bestScore = score;
    }
  }

  if (best) return best;

  return MEAL_DEFAULTS[recipe?.mealType] || MEAL_DEFAULTS['午餐'];
}
