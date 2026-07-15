import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createApp, initDatabase } from '../src/app.js';
import { closeDb, getDb, LIBRARY_USERNAME } from '../src/db.js';
import { profileToPlanningContext } from '../src/services/profilePlanningContext.js';
import { computeProfileMetrics } from '../src/services/userProfile.js';
import { getDefaultAdminPassword } from '../src/seed/ensureDefaultAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '../data/test-profile.db');

let server;
let baseUrl;

before(async () => {
  closeDb();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'profile-test-secret';
  initDatabase();
  server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
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

async function registerUser(username) {
  const { status, body } = await fetchJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password: 'pass1234', displayName: username }),
  });
  assert.equal(status, 201);
  return body;
}

async function loginAdmin() {
  const { status, body } = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'gnomd',
      password: getDefaultAdminPassword(),
    }),
  });
  assert.equal(status, 200);
  return body;
}

test('profile tables exist after migration', () => {
  const db = getDb();
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('user_profiles', 'user_profile_audit_log')
  `).all().map((row) => row.name).sort();
  assert.deepEqual(tables, ['user_profile_audit_log', 'user_profiles']);
});

test('auth/me does not expose sensitive profile fields', async () => {
  const reg = await registerUser(`p_auth_${Date.now()}`);
  await fetchJson('/api/profile/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${reg.token}` },
    body: JSON.stringify({
      body: { heightCm: 175, weightKg: 70, sexAtBirth: 'male', birthYear: 1995 },
      health: { conditions: ['高血压'] },
      privacy: { personalizationConsent: true },
    }),
  });
  const me = await fetchJson('/api/auth/me', {
    headers: { Authorization: `Bearer ${reg.token}` },
  });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.username, reg.user.username);
  assert.equal(me.body.user.heightCm, undefined);
  assert.equal(me.body.user.health, undefined);
  assert.equal(me.body.profile, undefined);
});

test('user can read write and clear own profile with audit', async () => {
  const reg = await registerUser(`p_self_${Date.now()}`);
  const headers = { Authorization: `Bearer ${reg.token}` };

  const empty = await fetchJson('/api/profile/me', { headers });
  assert.equal(empty.status, 200);
  assert.equal(empty.body.profile.body.heightCm, null);
  assert.ok(empty.body.planningPreview);

  const saved = await fetchJson('/api/profile/me', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      body: { heightCm: 170, weightKg: 62, sexAtBirth: 'female', birthYear: 1998 },
      lifestyle: { activityLevel: 'light' },
      diet: { dietPattern: 'omnivore', allergens: ['奶'] },
      privacy: { personalizationConsent: true },
    }),
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.profile.body.heightCm, 170);
  assert.ok(saved.body.profile.metrics.bmi > 0);
  assert.ok(saved.body.profile.metrics.bmr > 0);
  assert.equal(saved.body.profile.privacy.personalizationConsent, true);
  assert.ok(saved.body.planningPreview.personalizationEnabled);

  const audit = await fetchJson('/api/profile/me/audit', { headers });
  assert.equal(audit.status, 200);
  assert.ok(audit.body.entries.length >= 1);
  assert.ok(Array.isArray(audit.body.entries[0].changedFields));

  const cleared = await fetchJson('/api/profile/me', { method: 'DELETE', headers });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.cleared, true);
  assert.equal(cleared.body.profile.body.heightCm, null);
});

test('profile validation rejects out-of-range values', async () => {
  const reg = await registerUser(`p_bad_${Date.now()}`);
  const res = await fetchJson('/api/profile/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${reg.token}` },
    body: JSON.stringify({ body: { heightCm: 12 } }),
  });
  assert.equal(res.status, 400);
});

test('users cannot access another users profile via admin routes', async () => {
  const alice = await registerUser(`p_alice_${Date.now()}`);
  const bob = await registerUser(`p_bob_${Date.now()}`);
  await fetchJson('/api/profile/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${alice.token}` },
    body: JSON.stringify({ body: { heightCm: 180, weightKg: 75 } }),
  });

  const forbidden = await fetchJson(`/api/admin/users/${alice.user.id}/profile`, {
    headers: { Authorization: `Bearer ${bob.token}` },
  });
  assert.equal(forbidden.status, 403);
});

test('admin can assist edit another users profile', async () => {
  const user = await registerUser(`p_admin_target_${Date.now()}`);
  const admin = await loginAdmin();

  const patched = await fetchJson(`/api/admin/users/${user.user.id}/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin.token}` },
    body: JSON.stringify({
      body: { heightCm: 168, weightKg: 58, sexAtBirth: 'female', birthYear: 1996 },
      goals: { primaryGoals: ['健康维持'] },
    }),
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.profile.body.heightCm, 168);

  const viewed = await fetchJson(`/api/admin/users/${user.user.id}/profile`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(viewed.status, 200);
  assert.equal(viewed.body.profile.body.weightKg, 58);
  assert.ok(Array.isArray(viewed.body.audit));
});

test('recipe library account has no profile', async () => {
  const { getProfileDto } = await import('../src/services/userProfile.js');
  const lib = getDb().prepare('SELECT id FROM users WHERE username = ?').get(LIBRARY_USERNAME);
  assert.ok(lib);
  try {
    getProfileDto(lib.id);
    assert.fail('expected throw');
  } catch (error) {
    assert.equal(error.status, 404);
    assert.match(error.message, /食谱库/);
  }
});

test('gnomd initial profile migration seeds hair care without rewriting tasks', async () => {
  const admin = await loginAdmin();
  const profile = await fetchJson('/api/profile/me', {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.profile.health.hairCare.needed, true);
  assert.ok((profile.body.profile.health.medications || []).some((med) => med.name.includes('米诺')));

  const before = getDb().prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?')
    .get(admin.user.id).c;
  // Re-run init path migration id should no-op
  const { ensureGnomdProfile } = await import('../src/seed/ensureGnomdProfile.js');
  const again = ensureGnomdProfile();
  assert.equal(again.skipped, true);
  const after = getDb().prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?')
    .get(admin.user.id).c;
  assert.equal(after, before);
});

test('planning context maps allergies and safety flags without consent auto-enable', () => {
  const ctx = profileToPlanningContext({
    privacy: { personalizationConsent: false },
    diet: { allergens: ['花生'], uricAcidFriendly: true },
    fitness: { safetyFlags: { chestPain: true }, fitnessLevel: 'beginner' },
    body: { heightCm: 175, weightKg: 70, sexAtBirth: 'male', birthYear: 1990 },
    lifestyle: { activityLevel: 'moderate' },
  });
  assert.equal(ctx.personalizationEnabled, false);
  assert.deepEqual(ctx.diet.allergens, ['花生']);
  assert.equal(ctx.fitness.safetyRisk, true);
  assert.ok(ctx.fitness.safetyAdvice);
  const metrics = computeProfileMetrics({
    body: { heightCm: 175, weightKg: 70, sexAtBirth: 'male', birthYear: 1990 },
    lifestyle: { activityLevel: 'moderate' },
  });
  assert.ok(metrics.bmr > 1000);
  assert.ok(metrics.tdee > metrics.bmr);
});

test('deleting user cascades profile rows', async () => {
  const target = await registerUser(`p_del_${Date.now()}`);
  const admin = await loginAdmin();
  await fetchJson('/api/profile/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${target.token}` },
    body: JSON.stringify({ body: { heightCm: 171, weightKg: 66 } }),
  });
  const del = await fetchJson(`/api/admin/users/${target.user.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(del.status, 200);
  const row = getDb().prepare('SELECT 1 AS ok FROM user_profiles WHERE user_id = ?').get(target.user.id);
  assert.equal(row, undefined);
});

test('user can upload and delete avatar icon', async () => {
  const reg = await registerUser(`p_avatar_${Date.now()}`);
  const headers = { Authorization: `Bearer ${reg.token}` };
  // Minimal valid 1x1 JPEG
  const jpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLSUvLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

  const missing = await fetch(`${baseUrl}/api/profile/me/avatar`, { headers });
  assert.equal(missing.status, 404);

  const uploaded = await fetchJson('/api/profile/me/avatar', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ dataUrl: `data:image/jpeg;base64,${jpegBase64}` }),
  });
  assert.equal(uploaded.status, 200);
  assert.equal(uploaded.body.avatar.hasAvatar, true);

  const got = await fetch(`${baseUrl}/api/profile/me/avatar`, { headers });
  assert.equal(got.status, 200);
  assert.match(got.headers.get('content-type') || '', /image\/jpeg/);
  const buf = Buffer.from(await got.arrayBuffer());
  assert.ok(buf.length > 10);
  assert.equal(buf[0], 0xff);
  assert.equal(buf[1], 0xd8);

  const profile = await fetchJson('/api/profile/me', { headers });
  assert.equal(profile.body.profile.avatar.hasAvatar, true);

  const deleted = await fetchJson('/api/profile/me/avatar', {
    method: 'DELETE',
    headers,
  });
  assert.equal(deleted.status, 200);
  const missingAgain = await fetch(`${baseUrl}/api/profile/me/avatar`, { headers });
  assert.equal(missingAgain.status, 404);
});
