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
const TEST_DB = path.join(__dirname, '../data/test-auth.db');

let server;
let baseUrl;

before(async () => {
  const { closeDb: close } = await import('../src/db.js');
  close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'test-secret';
  initDatabase();
  const app = createApp();
  server = createServer(app);
  initSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server?.close();
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function fetchJson(url, options = {}) {
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function registerUser(username, password = 'pass123') {
  const { status, body } = await fetchJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName: username }),
  });
  assert.equal(status, 201);
  return body;
}

test('register and login flow', async () => {
  const reg = await registerUser('alice');
  assert.ok(reg.token);
  assert.equal(reg.user.username, 'alice');

  const login = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'alice', password: 'pass123' }),
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);

  const me = await fetchJson('/api/auth/me', {
    headers: { Authorization: `Bearer ${login.body.token}` },
  });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.username, 'alice');
});

test('tasks require authentication', async () => {
  const { status } = await fetchJson('/api/tasks?date=2026-07-01');
  assert.equal(status, 401);
});

test('user only accesses own tasks', async () => {
  const alice = await registerUser('bob');
  const bob = await registerUser('carol');

  const aTasks = await fetchJson('/api/tasks?date=2026-07-01', {
    headers: { Authorization: `Bearer ${alice.token}` },
  });
  assert.equal(aTasks.status, 200);
  assert.ok(aTasks.body.tasks.length >= 5);

  const taskId = aTasks.body.tasks[0].id;

  const patchBob = await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${bob.token}` },
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(patchBob.status, 404);

  const patchAlice = await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${alice.token}` },
    body: JSON.stringify({ completed: true }),
  });
  assert.equal(patchAlice.status, 200);
  assert.equal(patchAlice.body.completed, true);
});

test('audit log records task update', async () => {
  const user = await registerUser('dave');
  const day = await fetchJson('/api/tasks?date=2026-07-01', {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  const taskId = day.body.tasks[0].id;

  await fetchJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ title: '修改后标题' }),
  });

  const audit = await fetchJson(`/api/audit/task/${taskId}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  assert.equal(audit.status, 200);
  assert.ok(audit.body.logs.length >= 1);
  assert.equal(audit.body.logs[0].action, 'update');
  assert.equal(audit.body.logs[0].snapshot.title, '修改后标题');
});

test('create and delete task persists per user', async () => {
  const user = await registerUser('eve');
  const created = await fetchJson('/api/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      date: '2026-07-01',
      category: '自定义',
      title: '测试任务',
    }),
  });
  assert.equal(created.status, 201);

  const del = await fetchJson(`/api/tasks/${created.body.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user.token}` },
  });
  assert.equal(del.status, 200);
});

test('websocket emits task sync to same user', async () => {
  const { io } = await import('socket.io-client');
  const user = await registerUser('frank');

  const received = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('sync timeout')), 5000);
    const socket = io(baseUrl, {
      path: '/socket.io',
      auth: { token: user.token },
      transports: ['websocket'],
    });
    socket.on('connect', async () => {
      const day = await fetchJson('/api/tasks?date=2026-07-01', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const taskId = day.body.tasks[0].id;
      socket.once('task:sync', (payload) => {
        clearTimeout(timer);
        socket.disconnect();
        resolve(payload);
      });
      await fetchJson(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ completed: true }),
      });
    });
    socket.on('connect_error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });

  assert.equal(received.type, 'update');
  assert.ok(received.task);
});

test('default admin gnomd is seeded and can login', async () => {
  const { getDefaultAdminPassword } = await import('../src/seed/ensureDefaultAdmin.js');
  const { status, body } = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'gnomd', password: getDefaultAdminPassword() }),
  });
  assert.equal(status, 200);
  assert.equal(body.user.username, 'gnomd');
  assert.equal(body.user.role, 'admin');
  assert.ok(body.token);

  const day = '2026-07-14';
  const tasks = await fetchJson(`/api/tasks?date=${day}`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  assert.equal(tasks.status, 200);
  assert.ok(tasks.body.tasks.length > 0);
});
