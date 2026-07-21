/**
 * Dump: 早餐（豆浆 / 水果 / 面包）+ 午餐 + 下午茶水果；不含晚餐、夜宵
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SOY_BREAKFAST_RECIPES } from '../../task-planner/backend/src/seed/soyMilkBreakfastRecipes.js';
import {
  SOY_DRY_KCAL_PER_100G,
  BOILED_EGG_KCAL,
  parseSoyIngredientLine,
  estimateSoyBreakfastCalories,
} from '../../task-planner/backend/src/seed/soyIngredientCalories.js';
import { LUNCH_RECIPES } from '../../task-planner/backend/src/seed/mealRecipes.js';
import { AFTERNOON_TEA_RECIPES } from '../../task-planner/backend/src/seed/afternoonTeaRecipes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const FRUIT_SIDE = new Set(['小番茄', '樱桃番茄', '黄瓜']);
const BREAD_SIDE = new Set(['全麦面包', '玉米']);
const FAT_SIDE = new Set(['杏仁', '核桃仁']);

function byDay(list, day) {
  return list.find((r) => Number(r.planDay) === day)
    || list.find((r) => r.templateKey?.endsWith(`-d${day}`))
    || null;
}

function lunchByDay(day) {
  return LUNCH_RECIPES.find((r) => r.templateKey === `lunch-d${day}`) || null;
}

function parseLunchItems(recipe) {
  return String(recipe?.ingredients || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^｜|]+)[｜|]([^｜|]+?)(?:[｜|]\s*约?\s*(\d+)\s*千卡)?\s*$/);
      if (m) {
        return {
          food: m[2].trim(),
          kcal: m[3] ? Number(m[3]) : null,
        };
      }
      return { food: line, kcal: null };
    });
}

function lineKcal(line) {
  const parsed = parseSoyIngredientLine(line);
  if (!parsed) return null;
  return {
    name: parsed.name,
    food: line.replace(/（.*?）/g, '').trim(),
    kcal: Math.round((SOY_DRY_KCAL_PER_100G[parsed.name] * parsed.grams) / 100),
  };
}

/**
 * 早餐三块：
 * - 豆浆：干料打浆 + 水煮蛋 + 杏仁/核桃仁（豆浆餐标配；不含牛油果）
 * - 水果：小番茄 / 黄瓜
 * - 面包：全麦面包；无面包日则记玉米（轮换主食）
 */
function splitBreakfast(recipe) {
  const lines = String(recipe.ingredients || '').split('\n').map((l) => l.trim()).filter(Boolean);
  let soyKcal = 0;
  let fruitKcal = 0;
  let fruitLabel = '';
  let breadKcal = 0;
  let breadLabel = '';
  let eggCount = 0;

  for (const line of lines) {
    if (/清水|水约|ml|毫升/i.test(line)) continue;
    if (/水煮蛋/.test(line)) {
      eggCount = Number((line.match(/(\d+)\s*个/) || [])[1] || 2);
      continue;
    }
    const item = lineKcal(line);
    if (!item) continue;

    if (FRUIT_SIDE.has(item.name)) {
      fruitKcal += item.kcal;
      fruitLabel = item.food;
      continue;
    }
    if (BREAD_SIDE.has(item.name)) {
      breadKcal += item.kcal;
      breadLabel = item.food;
      continue;
    }
    // 豆浆干料 + 浆内坚果/芝麻 + 配餐杏仁/核桃仁
    soyKcal += item.kcal;
  }

  const eggKcal = eggCount * BOILED_EGG_KCAL;
  soyKcal += eggKcal;

  const soyExtras = [];
  if (eggCount) soyExtras.push(`水煮蛋 ${eggCount} 个`);
  for (const line of lines) {
    const item = lineKcal(line);
    if (item && FAT_SIDE.has(item.name)) soyExtras.push(item.food);
  }

  const soyRounded = Math.round(soyKcal / 5) * 5;
  const fruitRounded = Math.round(fruitKcal / 5) * 5;
  const breadRounded = Math.round(breadKcal / 5) * 5;
  const sum = soyRounded + fruitRounded + breadRounded;
  const recipeTotal = recipe.calories ?? estimateSoyBreakfastCalories(recipe.ingredients).calories;
  const drift = (recipeTotal || sum) - sum;

  return {
    title: recipe.title,
    total: recipeTotal,
    soy: {
      kcal: soyRounded + drift,
      detail: `豆浆干料${soyExtras.length ? ` + ${soyExtras.join(' + ')}` : ''}`,
    },
    fruit: {
      kcal: fruitRounded,
      detail: fruitLabel || '—',
    },
    bread: {
      kcal: breadRounded,
      detail: breadLabel || '—',
    },
  };
}

function fruitPartyNote(recipe) {
  const line = String(recipe?.ingredients || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/温开水|可选/.test(l));
  return line || recipe?.title || '';
}

/** 练前快碳：每天 1 根香蕉；周四与水果派对各半根，避免叠两根 */
function preWorkoutBanana(day) {
  if (day === 4) {
    return {
      kcal: 50,
      detail: '香蕉 半根（约 50～60g）',
      note: '训练前 30～60 分钟；周四另半根在水果派对',
    };
  }
  return {
    kcal: 100,
    detail: '香蕉 1 根（约 100～120g）',
    note: '训练前 30～60 分钟快碳',
  };
}

const daysData = DAYS.map((name, i) => {
  const d = i + 1;
  const bf = byDay(SOY_BREAKFAST_RECIPES, d);
  const lunch = lunchByDay(d);
  const tea = byDay(AFTERNOON_TEA_RECIPES, d);
  const breakfast = bf ? splitBreakfast(bf) : null;
  const banana = preWorkoutBanana(d);

  const breakfastKcal = breakfast?.total ?? 0;
  const lunchKcal = lunch?.calories ?? 0;
  const teaKcal = tea?.calories ?? 0;
  const bananaKcal = banana.kcal;

  return {
    name,
    breakfast,
    lunch: {
      kcal: lunchKcal,
      title: lunch?.title || '',
      items: lunch ? parseLunchItems(lunch) : [],
    },
    tea: {
      kcal: teaKcal,
      title: tea?.title || '',
      note: fruitPartyNote(tea),
    },
    preWorkout: banana,
    dailyTotal: breakfastKcal + lunchKcal + teaKcal + bananaKcal,
  };
});

const out = {
  days: DAYS,
  daysData,
  dailyTotals: daysData.map((d) => d.dailyTotal),
};

const outPath = path.join(__dirname, '../md/_weekly_meals_dump.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('wrote', outPath);
console.log('Mon breakfast', daysData[0].breakfast);
console.log('dailyTotals', out.dailyTotals);
