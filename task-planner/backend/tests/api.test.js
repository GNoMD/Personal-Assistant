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
const TEST_DB = path.join(__dirname, '../data/test-api.db');

let server;
let baseUrl;
let token;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'test-secret';
  initDatabase();

  const app = createApp();
  server = createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'test1234', displayName: 'Test' }),
  });
  const body = await res.json();
  token = body.token;
});

after(() => {
  server?.close();
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function fetchJson(url, options = {}) {
  const res = await fetch(`${baseUrl}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

test('health check returns ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'sqlite');
});

test('get tasks for 2026-07-01 (day 1)', async () => {
  const { status, body } = await fetchJson('/api/tasks?date=2026-07-01');
  assert.equal(status, 200);
  assert.equal(body.date, '2026-07-01');
  assert.equal(body.planDay, 1);
  assert.ok(body.tasks.length >= 5);
  assert.ok(body.tasks.every((t) => t.category !== '用药' && t.category !== '按摩'));
  assert.ok(!body.tasks.some((t) => /米诺|非那|SSM|头皮按摩/.test(t.title)));
  const withDuration = body.tasks.filter((t) => t.durationLabel);
  assert.ok(withDuration.length >= 5);
});

test('patch task completed persists', async () => {
  const { body: day1 } = await fetchJson('/api/tasks?date=2026-07-01');
  const task = day1.tasks[0];
  const { status, body } = await fetchJson(`/api/tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(status, 200);
  assert.equal(body.completed, true);

  const { body: refreshed } = await fetchJson('/api/tasks?date=2026-07-01');
  const updated = refreshed.tasks.find((t) => t.id === task.id);
  assert.equal(updated.completed, true);
});

test('calendar progress for July 2026', async () => {
  const { status, body } = await fetchJson('/api/tasks/calendar?year=2026&month=7');
  assert.equal(status, 200);
  assert.ok(body.days.length >= 28);
  assert.ok(Array.isArray(body.days[0].highlights));
  assert.ok(body.days[0].highlights.length >= 1);
});

test('7-day cycle repeats on day 8', async () => {
  const d1 = await fetchJson('/api/tasks?date=2026-07-01');
  const d8 = await fetchJson('/api/tasks?date=2026-07-08');
  assert.equal(d1.body.planDay, d8.body.planDay);
});
