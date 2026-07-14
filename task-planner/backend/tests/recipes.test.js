import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb } from '../src/db.js';
import { initSocket } from '../src/socket.js';
import { BREAKFAST_RECIPES } from '../src/seed/breakfastRecipes.js';
import { MEAL_RECIPES } from '../src/seed/mealRecipes.js';

const SYSTEM_RECIPE_COUNT = BREAKFAST_RECIPES.length + MEAL_RECIPES.length;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-recipes.db');
let server;
let baseUrl;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'recipe-test-secret';
  initDatabase();
  server = createServer(createApp());
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server?.close();
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function request(url, options = {}) {
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function register(username) {
  const { body } = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password: 'pass1234' }),
  });
  return body.token;
}

test('recipes require authentication', async () => {
  const res = await request('/api/recipes');
  assert.equal(res.status, 401);
});

test('user receives starter recipes and can CRUD custom recipe', async () => {
  const token = await register('recipeuser');
  const auth = { Authorization: `Bearer ${token}` };

  const list = await request('/api/recipes', { headers: auth });
  assert.equal(list.status, 200);
  assert.equal(list.body.recipes.length, SYSTEM_RECIPE_COUNT);
  assert.ok(list.body.recipes.every((recipe) => recipe.source !== 'other'));
  assert.ok(list.body.recipes.some((recipe) => recipe.title === '无豆山药莲子荞麦早餐'));
  assert.ok(list.body.recipes.some((recipe) => recipe.mealType === '午餐'));
  assert.ok(list.body.recipes.some((recipe) => recipe.mealType === '晚餐'));
  assert.ok(list.body.recipes.some((recipe) => recipe.mealType === '加餐'));
  assert.ok(list.body.recipes.some((recipe) => recipe.mealType === '饮品'));
  assert.ok(list.body.recipes.some((recipe) => recipe.title === '鸡胸糙米绿叶盘'));
  assert.ok(list.body.recipes.some((recipe) => recipe.title === '莓果无乳糖酸奶昔'));
  assert.ok(!list.body.recipes.some((recipe) => /周[一二三四五六日]/.test(recipe.title)));
  assert.ok(list.body.recipes.some((recipe) => recipe.tags.includes('高蛋白')));
  assert.ok(list.body.recipes.some((recipe) => recipe.ingredients.includes('约') && recipe.ingredients.includes('千卡')));

  const otherList = await request('/api/recipes?source=other', { headers: auth });
  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.recipes.length, 7);
  assert.ok(otherList.body.recipes.every((recipe) => recipe.source === 'other'));
  assert.ok(otherList.body.recipes.some((recipe) => recipe.title.includes('莲子黑豆百合安神款')));
  assert.ok(otherList.body.recipes.some((recipe) => recipe.ingredients.includes('黑豆12g')));

  const created = await request('/api/recipes', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: '自定义午餐',
      mealType: '午餐',
      ingredients: '鸡胸肉 100g\n西兰花 150g',
      steps: '鸡胸肉煎熟\n西兰花焯水',
      prepMinutes: 20,
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.mealType, '午餐');

  const detail = await request(`/api/recipes/${created.body.id}`, { headers: auth });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.title, '自定义午餐');

  const updated = await request(`/api/recipes/${created.body.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ isFavorite: true, calories: 380 }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.isFavorite, true);
  assert.equal(updated.body.calories, 380);

  const deleted = await request(`/api/recipes/${created.body.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  assert.equal(deleted.status, 200);
});

test('shared recipe library is visible to all users; custom stays private', async () => {
  const firstToken = await register('recipeowner');
  const secondToken = await register('recipeviewer');

  const firstList = await request('/api/recipes', {
    headers: { Authorization: `Bearer ${firstToken}` },
  });
  const secondList = await request('/api/recipes', {
    headers: { Authorization: `Bearer ${secondToken}` },
  });
  assert.equal(firstList.status, 200);
  assert.equal(secondList.status, 200);
  assert.equal(firstList.body.recipes.length, SYSTEM_RECIPE_COUNT);
  assert.equal(secondList.body.recipes.length, SYSTEM_RECIPE_COUNT);
  assert.deepEqual(
    firstList.body.recipes.map((r) => r.id).sort(),
    secondList.body.recipes.map((r) => r.id).sort()
  );

  const created = await request('/api/recipes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${firstToken}` },
    body: JSON.stringify({
      title: '私有食谱',
      ingredients: '私有食材',
      steps: '私有步骤',
    }),
  });

  const forbidden = await request(`/api/recipes/${created.body.id}`, {
    headers: { Authorization: `Bearer ${secondToken}` },
  });
  assert.equal(forbidden.status, 404);

  const sharedId = firstList.body.recipes[0].id;
  const sharedOk = await request(`/api/recipes/${sharedId}`, {
    headers: { Authorization: `Bearer ${secondToken}` },
  });
  assert.equal(sharedOk.status, 200);
  assert.equal(sharedOk.body.shared, true);
});
