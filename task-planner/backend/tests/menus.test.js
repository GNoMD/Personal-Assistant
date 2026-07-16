import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb } from '../src/db.js';
import { initSocket } from '../src/socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-menus.db');
let server;
let baseUrl;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'menu-test-secret';
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

test('menus require authentication', async () => {
  const res = await request('/api/menus');
  assert.equal(res.status, 401);
});

test('user can create list update and delete menus', async () => {
  const token = await register('menuuser');
  const auth = { Authorization: `Bearer ${token}` };

  const recipes = await request('/api/recipes', { headers: auth });
  assert.equal(recipes.status, 200);
  assert.ok(recipes.body.recipes.length >= 2);
  const [a, b, c] = recipes.body.recipes;

  const tooFew = await request('/api/menus', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ title: '单菜', recipeIds: [a.id] }),
  });
  assert.equal(tooFew.status, 400);

  const created = await request('/api/menus', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: '轻食午餐组合',
      mealType: '午餐',
      notes: '工作日',
      tags: '轻食,高蛋白',
      recipeIds: [a.id, b.id],
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.title, '轻食午餐组合');
  assert.equal(created.body.recipeCount, 2);
  assert.equal(created.body.items.length, 2);
  assert.equal(created.body.items[0].recipeId, a.id);

  const list = await request('/api/menus', { headers: auth });
  assert.equal(list.status, 200);
  assert.equal(list.body.menus.length, 1);

  const detail = await request(`/api/menus/${created.body.id}`, { headers: auth });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.items[1].title, b.title);

  const updated = await request(`/api/menus/${created.body.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({
      title: '加菜版午餐',
      isFavorite: true,
      recipeIds: [b.id, a.id, c.id],
    }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.title, '加菜版午餐');
  assert.equal(updated.body.isFavorite, true);
  assert.equal(updated.body.recipeCount, 3);
  assert.equal(updated.body.items[0].recipeId, b.id);

  const blocked = await request(`/api/recipes/${a.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  // system shared recipes cannot be deleted; create custom and test block
  const custom = await request('/api/recipes', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: '自定义配菜',
      mealType: '加餐',
      ingredients: '黄瓜 100g',
      steps: '切片',
    }),
  });
  assert.equal(custom.status, 201);

  const withCustom = await request(`/api/menus/${created.body.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ recipeIds: [a.id, custom.body.id] }),
  });
  assert.equal(withCustom.status, 200);

  const delCustom = await request(`/api/recipes/${custom.body.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  assert.equal(delCustom.status, 409);

  const deleted = await request(`/api/menus/${created.body.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  assert.equal(deleted.status, 200);

  const delCustom2 = await request(`/api/recipes/${custom.body.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  assert.equal(delCustom2.status, 200);
});

test('menus are isolated per user', async () => {
  const tokenA = await register('menuowner');
  const tokenB = await register('menuviewer');
  const authA = { Authorization: `Bearer ${tokenA}` };
  const authB = { Authorization: `Bearer ${tokenB}` };

  const recipes = await request('/api/recipes', { headers: authA });
  const [a, b] = recipes.body.recipes;
  const created = await request('/api/menus', {
    method: 'POST',
    headers: authA,
    body: JSON.stringify({ title: '私有菜单', recipeIds: [a.id, b.id] }),
  });
  assert.equal(created.status, 201);

  const listB = await request('/api/menus', { headers: authB });
  assert.equal(listB.body.menus.length, 0);

  const detailB = await request(`/api/menus/${created.body.id}`, { headers: authB });
  assert.equal(detailB.status, 404);
});
