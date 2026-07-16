import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb, getDb } from '../src/db.js';
import {
  ensureAssistantPersonality,
  getAssistantRulePath,
  matchPersonalityFromProfile,
  readAssistantRuleFile,
  setAssistantPersonality,
} from '../src/services/assistantPersonality.js';
import { saveUserProfile } from '../src/services/userProfile.js';
import { assistantInstructions } from '../src/routes/assistant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-personality.db');
let appServer;
let baseUrl;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'personality-test-secret';
  process.env.OPENCLAW_ENABLED = 'false';
  initDatabase();
  appServer = createServer(createApp());
  await new Promise((resolve) => appServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${appServer.address().port}`;
});

after(() => {
  appServer?.close();
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

async function register(suffix = '') {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `pers_${Date.now()}_${suffix}`,
      password: 'pass1234',
      displayName: '人设测试',
    }),
  });
  const data = await res.json();
  assert.equal(res.status, 201, data.error || '');
  return data;
}

test('ensure without profile requires picker', async () => {
  const { user } = await register('a');
  // register already ran ensure; clear personality to simulate bare user
  getDb().prepare('UPDATE users SET assistant_personality = NULL WHERE id = ?').run(user.id);
  const rulePath = getAssistantRulePath(user.id);
  if (fs.existsSync(rulePath)) fs.unlinkSync(rulePath);

  const state = ensureAssistantPersonality(user.id);
  assert.equal(state.needsPicker, true);
  assert.equal(state.current, null);
});

test('ensure with usable profile auto-assigns and writes rule.md', async () => {
  const { user, token } = await register('b');
  getDb().prepare('UPDATE users SET assistant_personality = NULL WHERE id = ?').run(user.id);

  saveUserProfile(user.id, {
    lifestyle: { activityLevel: 'high' },
    fitness: { fitnessLevel: 'advanced', trainDaysPerWeek: 5, fitnessGoals: ['增肌'] },
    goals: { primaryGoals: ['增肌'] },
    privacy: { personalizationConsent: true },
  }, { id: user.id, role: 'user' });

  const state = ensureAssistantPersonality(user.id);
  assert.equal(state.needsPicker, false);
  assert.ok(state.current);
  assert.equal(state.profileBased, true);
  assert.ok(fs.existsSync(getAssistantRulePath(user.id)));
  const md = readAssistantRuleFile(user.id);
  assert.match(md, /助手人设/);
  assert.match(md, /增肌/);

  const me = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await me.json();
  assert.equal(me.status, 200);
  assert.equal(meBody.user.assistantPersonality, state.current);
});

test('PUT personality rejects invalid id and accepts valid', async () => {
  const { token, user } = await register('c');
  const bad = await fetch(`${baseUrl}/api/assistant/personality`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ personality: 'not-a-real-type' }),
  });
  assert.equal(bad.status, 400);

  const ok = await fetch(`${baseUrl}/api/assistant/personality`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ personality: 'oneesan' }),
  });
  const body = await ok.json();
  assert.equal(ok.status, 200);
  assert.equal(body.current, 'oneesan');
  assert.equal(body.user.assistantPersonality, 'oneesan');
  assert.match(readAssistantRuleFile(user.id), /御姐型/);
});

test('assistantInstructions includes selected personality rules', async () => {
  const { user } = await register('d');
  setAssistantPersonality(user.id, 'coach');
  const text = assistantInstructions({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    assistant_personality: 'coach',
  });
  assert.match(text, /毒舌教练型|coach/);
  assert.match(text, /人设规则/);
});

test('matchPersonalityFromProfile prefers coach for heavy training', () => {
  const id = matchPersonalityFromProfile({
    completeness: { score: 40 },
    fitness: { trainDaysPerWeek: 5, fitnessGoals: ['增肌'] },
    goals: { primaryGoals: ['增肌'] },
    lifestyle: {},
    diet: {},
    health: {},
    body: {},
  });
  assert.equal(id, 'coach');
});
