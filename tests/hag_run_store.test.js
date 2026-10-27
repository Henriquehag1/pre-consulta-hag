'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRunStore, decodeSubject } = require('../hag_run_store.js');

function jwt(claims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `header.${payload}.signature`;
}

test('JWT subject extraction requires an authenticated user identity', () => {
  assert.equal(decodeSubject(jwt({ sub: 'user-123' })), 'user-123');
  assert.equal(decodeSubject(jwt({ role: 'anon' })), null);
  assert.equal(decodeSubject('not-a-jwt'), null);
});

test('persistence is unavailable without explicit development configuration', () => {
  assert.equal(createRunStore(null).available, false);
  assert.equal(createRunStore({ url: 'https://example.supabase.co', anonKey: 'public' }).available, false);
});

test('save uses one authenticated atomic RPC and sends separated program, prescription, execution', async () => {
  const requests = [];
  const store = createRunStore({ url: 'https://dev.supabase.co/', anonKey: 'public-key', getAccessToken: () => jwt({ sub: 'user-123' }) }, async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ program_id: 'p1', prescription_id: 'rx1', execution_id: 'ex1' }) };
  });
  const result = await store.save({ slug: 'rumo_5k', title: 'Rumo aos 5 km', goal: '5k' },
    { engineVersion: 'hag-run-engine/0.1.0', assessment: { level: 'R0' }, plan: { week: 1 } },
    { sessionId: 's1', completed: false, durationSeconds: 300, distanceKm: 0, rpe: 3,
      difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good' });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://dev.supabase.co/rest/v1/rpc/hag_run_save');
  assert.equal(requests[0].options.headers.Authorization, `Bearer ${jwt({ sub: 'user-123' })}`);
  const body = JSON.parse(requests[0].options.body);
  assert.equal(body.p_program.slug, 'rumo_5k');
  assert.equal(body.p_prescription.plan.week, 1);
  assert.equal(body.p_execution.session_id, 's1');
  assert.equal('user_id' in body.p_program, false);
  assert.deepEqual(result, { program_id: 'p1', prescription_id: 'rx1', execution_id: 'ex1' });
});

test('save refuses anon or malformed tokens before making a request', async () => {
  let called = false;
  const store = createRunStore({ url: 'https://dev.supabase.co', anonKey: 'public-key', getAccessToken: () => jwt({ role: 'anon' }) }, async () => { called = true; });
  await assert.rejects(() => store.save({}, {}, {}), /autenticada/);
  assert.equal(called, false);
});

test('failed atomic RPC surfaces error and does not report a successful save', async () => {
  const store = createRunStore({ url: 'https://dev.supabase.co', anonKey: 'public-key', getAccessToken: () => jwt({ sub: 'user-123' }) }, async () => ({ ok: false, status: 403 }));
  await assert.rejects(() => store.save({}, {}, {}), /403/);
});
