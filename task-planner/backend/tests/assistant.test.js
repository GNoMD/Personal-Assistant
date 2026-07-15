import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb, getDb } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-assistant.db');
let appServer;
let gatewayServer;
let baseUrl;
const gatewaySessionKeys = [];

function sse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'assistant-test-secret';
  process.env.OPENCLAW_ENABLED = 'true';
  process.env.OPENCLAW_GATEWAY_TOKEN = 'test-token';
  process.env.OPENCLAW_AGENT_ID = 'main';
  process.env.OPENCLAW_CONTEXT_CHAR_LIMIT = '120000';

  gatewayServer = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw || '{}');
    gatewaySessionKeys.push(req.headers['x-openclaw-session-key'] || body.user || '');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    sse(res, 'response.created', { response: { id: 'resp-test' } });

    if (Array.isArray(body.input) && body.input[0]?.type === 'function_call_output') {
      sse(res, 'response.output_text.delta', { type: 'response.output_text.delta', delta: '操作已完成。' });
    } else if (String(body.input).includes('创建')) {
      sse(res, 'response.output_item.done', {
        item: {
          type: 'function_call',
          name: 'create_task',
          call_id: 'call-create',
          arguments: JSON.stringify({
            date: '2026-07-20',
            time: '19:00',
            category: '运动',
            title: '散步 30 分钟',
            description: '轻松散步',
          }),
        },
      });
    } else if (String(body.input).includes('任务')) {
      sse(res, 'response.output_item.done', {
        item: {
          type: 'function_call',
          name: 'list_tasks',
          call_id: 'call-read',
          arguments: JSON.stringify({ date: '2026-07-01' }),
        },
      });
    } else {
      sse(res, 'response.output_text.delta', { type: 'response.output_text.delta', delta: '你好' });
    }
    sse(res, 'response.completed', { response: { id: 'resp-test', output: [] } });
    res.write('data: [DONE]\n\n');
    res.end();
  });
  await new Promise((resolve) => gatewayServer.listen(0, resolve));
  process.env.OPENCLAW_RESPONSES_URL =
    `http://127.0.0.1:${gatewayServer.address().port}/v1/responses`;

  initDatabase();
  appServer = createServer(createApp());
  await new Promise((resolve) => appServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${appServer.address().port}`;
});

after(() => {
  appServer?.close();
  gatewayServer?.close();
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function register() {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `assistant_${Date.now()}`,
      password: 'pass1234',
      displayName: '助手测试',
    }),
  });
  return res.json();
}

async function postSse(pathname, token, body) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

test('assistant requires authentication', async () => {
  const res = await fetch(`${baseUrl}/api/assistant/health`);
  assert.equal(res.status, 401);
});

test('assistant streams text and executes scoped read tools', async () => {
  const { token } = await register();
  const hello = await postSse('/api/assistant/chat', token, { message: '你好' });
  assert.equal(hello.status, 200);
  assert.match(hello.text, /"delta":"你好"/);
  assert.match(hello.text, /"type":"session"/);

  const tasks = await postSse('/api/assistant/chat', token, { message: '查看任务' });
  assert.equal(tasks.status, 200);
  assert.match(tasks.text, /"type":"tool_result"/);
  assert.match(tasks.text, /"delta":"操作已完成。"/);
});

test('assistant write action is pending until user confirms', async () => {
  const { token, user } = await register();
  const proposal = await postSse('/api/assistant/chat', token, { message: '创建散步任务' });
  assert.equal(proposal.status, 200);
  const match = proposal.text.match(/"action":\{"id":"([^"]+)"/);
  assert.ok(match, proposal.text);
  const actionId = match[1];

  const before = getDb().prepare(
    "SELECT COUNT(*) AS n FROM tasks WHERE user_id = ? AND date = '2026-07-20' AND title = '散步 30 分钟'"
  ).get(user.id);
  assert.equal(before.n, 0);

  const other = await register();
  const forbidden = await postSse(
    `/api/assistant/actions/${actionId}/resolve`,
    other.token,
    { approve: true }
  );
  assert.equal(forbidden.status, 400);
  assert.match(forbidden.text, /不存在|无权|过期/);

  const confirmed = await postSse(
    `/api/assistant/actions/${actionId}/resolve`,
    token,
    { approve: true }
  );
  assert.equal(confirmed.status, 200);
  assert.match(confirmed.text, /"type":"action_result"/);

  const after = getDb().prepare(
    "SELECT COUNT(*) AS n FROM tasks WHERE user_id = ? AND date = '2026-07-20' AND title = '散步 30 分钟'"
  ).get(user.id);
  assert.equal(after.n, 1);
});

test('assistant cannot access other users tasks or sessions', async () => {
  const alice = await register();
  const bob = await register();
  const db = getDb();

  // Seed one private task for Alice and one for Bob on the same date.
  const planDay = 1;
  db.prepare(`
    INSERT INTO tasks (
      user_id, date, plan_day, plan_name, time, category, title, description, completed, sort_order
    ) VALUES (?, '2026-07-01', ?, '测试日', '08:00', '运动', ?, '', 0, 0)
  `).run(alice.user.id, planDay, 'Alice 私有任务');
  const bobTask = db.prepare(`
    INSERT INTO tasks (
      user_id, date, plan_day, plan_name, time, category, title, description, completed, sort_order
    ) VALUES (?, '2026-07-01', ?, '测试日', '09:00', '运动', ?, '', 0, 0)
  `).run(bob.user.id, planDay, 'Bob 私有任务');
  const bobTaskId = Number(bobTask.lastInsertRowid);

  const { executeReadAssistantTool, createPendingAssistantAction, assertOwnScopeArgs } =
    await import('../src/services/assistantTools.js');

  assert.throws(
    () => assertOwnScopeArgs({ date: '2026-07-01', username: 'bob' }),
    /禁止访问其他用户/
  );

  const listed = executeReadAssistantTool(
    'list_tasks',
    { date: '2026-07-01' },
    { id: alice.user.id, username: alice.user.username, displayName: alice.user.displayName }
  );
  assert.equal(listed.scope, 'self_only');
  assert.equal(listed.ownerUsername, alice.user.username);
  assert.ok(listed.tasks.some((task) => task.title === 'Alice 私有任务'));
  assert.ok(!listed.tasks.some((task) => task.title === 'Bob 私有任务'));

  assert.throws(
    () => createPendingAssistantAction({
      userId: alice.user.id,
      callId: 'call-x',
      responseId: 'resp-x',
      toolName: 'update_task',
      args: { task_id: bobTaskId, completed: true },
    }),
    /不存在或无权/
  );

  assert.throws(
    () => executeReadAssistantTool(
      'list_tasks',
      { date: '2026-07-01', user_id: bob.user.id },
      { id: alice.user.id, username: alice.user.username }
    ),
    /禁止访问其他用户/
  );

  const aliceChat = await postSse('/api/assistant/chat', alice.token, { message: '你好' });
  const sessionId = aliceChat.text.match(/"sessionId":"([^"]+)"/)?.[1];
  assert.ok(sessionId);
  const bobPeek = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${bob.token}` },
  });
  assert.equal(bobPeek.status, 404);
});

test('same user keeps one OpenClaw window across local chats until rotation', async () => {
  const { token, user } = await register();
  gatewaySessionKeys.length = 0;

  const first = await postSse('/api/assistant/chat', token, { message: '你好' });
  assert.equal(first.status, 200);
  assert.match(first.text, /"type":"openclaw_window"/);
  assert.match(first.text, new RegExp(`taskplanner-user-${user.id}-w1`));

  const second = await postSse('/api/assistant/chat', token, { message: '继续' });
  assert.equal(second.status, 200);
  assert.match(second.text, new RegExp(`taskplanner-user-${user.id}-w1`));

  const keysForUser = gatewaySessionKeys.filter((key) => key.includes(`taskplanner-user-${user.id}`));
  assert.ok(keysForUser.length >= 2);
  assert.ok(keysForUser.every((key) => key === `taskplanner-user-${user.id}-w1`));

  const {
    getOrCreateOpenClawWindow,
    rotateOpenClawWindow,
  } = await import('../src/services/assistantOpenClawWindows.js');
  const before = getOrCreateOpenClawWindow(user.id);
  assert.equal(before.windowGen, 1);
  const rotated = rotateOpenClawWindow(user.id, 'test');
  assert.equal(rotated.windowGen, 2);
  assert.equal(rotated.sessionKey, `taskplanner-user-${user.id}-w2`);
  assert.equal(rotated.previousResponseId, null);
});

test('assistant can delete a single message bubble', async () => {
  const { token } = await register();
  const chat = await postSse('/api/assistant/chat', token, { message: '你好' });
  assert.equal(chat.status, 200);
  const sessionId = chat.text.match(/"sessionId":"([^"]+)"/)?.[1];
  const assistantMessageId = chat.text.match(/"assistantMessageId":"([^"]+)"/)?.[1];
  assert.ok(sessionId);
  assert.ok(assistantMessageId);

  const detailBefore = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
  assert.ok(detailBefore.session.messages.some((item) => item.id === assistantMessageId));

  const deleted = await fetch(`${baseUrl}/api/assistant/messages/${assistantMessageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(deleted.status, 200);
  const deletedBody = await deleted.json();
  assert.equal(deletedBody.deleted, true);

  const detailAfter = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
  assert.ok(!detailAfter.session.messages.some((item) => item.id === assistantMessageId));
});

test('assistant sessions persist and can be resumed', async () => {
  const { token } = await register();
  const chat = await postSse('/api/assistant/chat', token, { message: '你好' });
  assert.equal(chat.status, 200);
  const sessionMatch = chat.text.match(/"sessionId":"([^"]+)"/);
  assert.ok(sessionMatch, chat.text);
  const sessionId = sessionMatch[1];

  const listRes = await fetch(`${baseUrl}/api/assistant/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listBody = await listRes.json();
  assert.equal(listRes.status, 200);
  assert.ok(listBody.sessions.some((item) => item.id === sessionId));

  const detailRes = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailBody = await detailRes.json();
  assert.equal(detailRes.status, 200);
  assert.ok(detailBody.session.messages.length >= 2);
  assert.equal(detailBody.session.messages[0].role, 'user');
  assert.equal(detailBody.session.messages[0].content, '你好');
  assert.equal(detailBody.session.messages[1].role, 'assistant');
  assert.match(detailBody.session.messages[1].content, /你好/);

  const continued = await postSse('/api/assistant/chat', token, {
    message: '再问一次',
    sessionId,
    previousResponseId: detailBody.session.previousResponseId,
  });
  assert.equal(continued.status, 200);
  assert.match(continued.text, new RegExp(`"sessionId":"${sessionId}"`));

  const other = await register();
  const forbidden = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${other.token}` },
  });
  assert.equal(forbidden.status, 404);

  const deleted = await fetch(`${baseUrl}/api/assistant/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(deleted.status, 200);
});

test('assistant scope is data-only and tools cannot modify UI pages', async () => {
  const { ASSISTANT_TOOLS } = await import('../src/services/assistantTools.js');
  const { assistantInstructions } = await import('../src/routes/assistant.js');
  const names = ASSISTANT_TOOLS.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    'create_task',
    'delete_task',
    'list_tasks',
    'search_recipes',
    'update_task',
  ]);
  for (const tool of ASSISTANT_TOOLS) {
    assert.match(tool.description, /不能改|不能修改/);
  }
  const text = assistantInstructions({ username: 't', displayName: '测' });
  assert.match(text, /系统功能页面/);
  assert.match(text, /只能操作「系统数据」/);
  assert.match(text, /明确拒绝/);
});
