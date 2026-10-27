'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRunStore, validLinkToken, isServiceRoleKey } = require('../hag_run_store.js');

const tokenA = 'a'.repeat(48);
const tokenB = 'b'.repeat(48);
const config = token => ({ url: 'https://dev.supabase.co/', anonKey: 'public-anon-key', token });
const response = value => ({ ok: true, status: 200, json: async () => value });

test('link validation accepts only bounded hex bearer tokens', () => {
  assert.equal(validLinkToken(tokenA), true);
  assert.equal(validLinkToken('x'.repeat(48)), false);
  assert.equal(validLinkToken('a'.repeat(31)), false);
  assert.equal(validLinkToken('a'.repeat(129)), false);
});

test('persistence is unavailable without a valid personal link or public key', () => {
  assert.equal(createRunStore(null).available, false);
  assert.equal(createRunStore(config('patient-123')).available, false);
  assert.equal(createRunStore({ ...config(tokenA), anonKey: 'service_role-secret' }).available, false);
  const serviceJwt = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.equal(isServiceRoleKey(serviceJwt), true);
  assert.equal(createRunStore({ ...config(tokenA), anonKey: serviceJwt }).available, false);
});

test('context recovery sends only the bearer token, never a patient identifier', async () => {
  const requests = [];
  const store = createRunStore(config(tokenA), async (url, options) => {
    requests.push({ url, options });
    return response({ ok: true, program: { profile: { goal: '5k' } }, prescription: { plan: { week: 2 } }, history: [] });
  });
  const context = await store.load();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://dev.supabase.co/rest/v1/rpc/hag_run_patient_context');
  assert.deepEqual(JSON.parse(requests[0].options.body), { p_token: tokenA });
  assert.match(requests[0].options.headers.Authorization, /^Bearer public-anon-key$/);
  assert.equal(context.prescription.plan.week, 2);
});

test('patient A and patient B contexts remain bound to their own opaque tokens', async () => {
  const returned = new Map([[tokenA, { ok: true, patient_label: 'A', history: [{ session_id: 'a1' }] }],
    [tokenB, { ok: true, patient_label: 'B', history: [{ session_id: 'b1' }] }]]);
  const fetchMock = async (_url, options) => response(returned.get(JSON.parse(options.body).p_token));
  const a = await createRunStore(config(tokenA), fetchMock).load();
  const b = await createRunStore(config(tokenB), fetchMock).load();
  assert.deepEqual(a.history.map(x => x.session_id), ['a1']);
  assert.deepEqual(b.history.map(x => x.session_id), ['b1']);
});

test('adding or changing a patient identifier cannot override token-based authorization', async () => {
  let request;
  const store = createRunStore({ ...config(tokenA), patientId: 'patient-B', urlPatientId: 'patient-B' }, async (url, options) => {
    request = { url, body: JSON.parse(options.body) };
    return response({ ok: true, program: null, prescription: null, history: [] });
  });
  await store.load();
  assert.deepEqual(request.body, { p_token: tokenA });
  assert.equal(request.url.endsWith('hag_run_patient_context'), true);
});

test('invalid, expired or revoked links are rejected without fallback to client identity', async () => {
  const store = createRunStore(config(tokenA), async () => response({ ok: false, error: 'invalid_link' }));
  await assert.rejects(() => store.load(), /Link inválido, expirado ou revogado/);
  await assert.rejects(() => store.saveAssessment({ slug: 'rumo_5k' }, { engineVersion: 'v1', week: 1 }, {}), /Link inválido, expirado ou revogado/);
  await assert.rejects(() => store.saveExecution({}, {}, { clientEventId: 'd2719b2d-d8e1-47e0-95a5-a181f087dcef', sessionId: 's1' }), /Link inválido, expirado ou revogado/);
});

test('assessment writes program, profile and immutable prescription as distinct payloads', async () => {
  const requests = [];
  const store = createRunStore(config(tokenA), async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return response({ ok: true, program_id: 'p1', prescription_id: 'rx1' });
  });
  await store.saveAssessment({ slug: 'rumo_5k', title: 'Rumo aos 5 km' },
    { engineVersion: 'hag-run-engine/0.1.0', week: 1, sessions: [], classification: { level: 'R0' } }, { level: 'R0' });
  assert.equal(requests[0].url, 'https://dev.supabase.co/rest/v1/rpc/hag_run_patient_save_assessment');
  assert.deepEqual(Object.keys(requests[0].body).sort(), ['p_assessment', 'p_prescription', 'p_profile', 'p_program', 'p_token'].sort());
  assert.deepEqual(requests[0].body.p_prescription.plan.sessions, []);
  assert.deepEqual(requests[0].body.p_profile, { inputs: { level: 'R0' }, functional: { level: 'R0' } });
  assert.equal('patient_id' in requests[0].body, false);
});

test('execution writes idempotency key, observations, recovery and progression recommendation', async () => {
  const requests = [];
  const store = createRunStore(config(tokenA), async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return response({ ok: true, execution_id: 'ex1', duplicate: false });
  });
  const out = await store.saveExecution({ slug: 'rumo_5k', title: 'Rumo aos 5 km' },
    { engineVersion: 'hag-run-engine/0.1.0', week: 1 },
    { clientEventId: 'd2719b2d-d8e1-47e0-95a5-a181f087dcef', sessionId: 'hag-run-r0-w1-mon', completed: false,
      durationSeconds: 300, distanceKm: 0, rpe: 5, difficulty: 'moderate', pain: 1, fatigue: 4,
      recovery: 'partial', concerningSymptoms: false, injuryDuringRun: false, paceSecondsPerKm: null });
  assert.deepEqual(out, { ok: true, execution_id: 'ex1', duplicate: false });
  assert.equal(requests[0].p_session_id, 'hag-run-r0-w1-mon');
  assert.equal(requests[0].p_execution.recovery, 'partial');
  assert.equal('p_recommendation' in requests[0], false);
  assert.equal('patient_id' in requests[0].p_execution, false);
});

test('the same event key can be safely retried without creating a second execution', async () => {
  let calls = 0;
  const store = createRunStore(config(tokenA), async () => {
    calls++;
    return response({ ok: true, execution_id: 'stable-id', duplicate: calls > 1 });
  });
  const args = [{ slug: 'rumo_5k' }, { engineVersion: 'v1', week: 1 },
    { clientEventId: 'd2719b2d-d8e1-47e0-95a5-a181f087dcef', sessionId: 'session1', completed: false,
      durationSeconds: 1, distanceKm: 0, rpe: 1, difficulty: 'easy', pain: 0, fatigue: 0, recovery: 'good' }];
  const first = await store.saveExecution(...args);
  const retry = await store.saveExecution(...args);
  assert.equal(calls, 2);
  assert.equal(first.execution_id, retry.execution_id);
  assert.equal(retry.duplicate, true);
});

test('reopening the application restores persisted profile, prescription and run history', async () => {
  const persisted = { program: null, prescription: null, history: [] };
  const fetchMock = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.endsWith('hag_run_patient_save_assessment')) {
      persisted.program = { profile: body.p_profile, assessment: body.p_assessment };
      persisted.prescription = body.p_prescription;
      return response({ ok: true, program_id: 'p1', prescription_id: 'rx1' });
    }
    if (url.endsWith('hag_run_patient_save_execution')) {
      persisted.history.push({ session_id: body.p_session_id, ...body.p_execution });
      return response({ ok: true, execution_id: 'ex1', duplicate: false });
    }
    return response({ ok: true, ...persisted });
  };
  const firstVisit = createRunStore(config(tokenA), fetchMock);
  const profile = { assessmentDate: '2026-10-27', goal: '5k', level: 'R0' };
  const plan = { engineVersion: 'hag-run-engine/0.1.0', week: 1, classification: { level: 'R0' }, sessions: [] };
  await firstVisit.saveAssessment({ slug: 'rumo_5k', title: 'Rumo aos 5 km' }, plan, profile);
  await firstVisit.saveExecution({ slug: 'rumo_5k', title: 'Rumo aos 5 km' }, plan,
    { clientEventId: 'd2719b2d-d8e1-47e0-95a5-a181f087dcef', sessionId: 'hag-run-r0-w1-mon', completed: false,
      durationSeconds: 240, distanceKm: 0.4, rpe: 4, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good' });
  const reopened = await createRunStore(config(tokenA), fetchMock).load();
  assert.deepEqual(reopened.program.profile.inputs, profile);
  assert.deepEqual(reopened.prescription.plan, plan);
  assert.equal(reopened.history[0].session_id, 'hag-run-r0-w1-mon');
});

test('HTTP errors never report persistence success', async () => {
  const store = createRunStore(config(tokenA), async () => ({ ok: false, status: 403 }));
  await assert.rejects(() => store.load(), /403/);
});
