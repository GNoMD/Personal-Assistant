import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-fitness.db');
let server;
let baseUrl;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'fitness-test-secret';
  initDatabase();
  server = createServer(createApp());
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

test('fitness favorites require authentication', async () => {
  const res = await request('/api/fitness/favorites');
  assert.equal(res.status, 401);
});

test('can favorite equipment and sports', async () => {
  const token = await register(`fit_${Date.now()}`);
  const auth = { Authorization: `Bearer ${token}` };

  const empty = await request('/api/fitness/favorites', { headers: auth });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.itemIds, []);

  const add = await request('/api/fitness/favorites/running', {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ isFavorite: true }),
  });
  assert.equal(add.status, 200);
  assert.equal(add.body.isFavorite, true);
  assert.ok(add.body.itemIds.includes('running'));

  const addEquip = await request('/api/fitness/favorites/leg-press', {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ isFavorite: true }),
  });
  assert.equal(addEquip.status, 200);
  assert.equal(addEquip.body.itemIds.length, 2);

  const remove = await request('/api/fitness/favorites/running', {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ isFavorite: false }),
  });
  assert.equal(remove.status, 200);
  assert.deepEqual(remove.body.itemIds, ['leg-press']);
});
