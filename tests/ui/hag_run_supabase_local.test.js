'use strict';

const assert = require('node:assert/strict');

const apiUrl = process.env.HAG_RUN_LOCAL_API_URL;
const anonKey = process.env.HAG_RUN_LOCAL_ANON_KEY;
if (!apiUrl || !anonKey) throw new Error('Run this test from scripts/test-hag-run-supabase-local.sh.');

async function rpc(name, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(response.ok, true, `${name} returned HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const patientA = await rpc('hag_run_patient_context', { p_token: 'a'.repeat(48) });
  assert.equal(patientA.ok, true);
  assert.equal(patientA.history.length, 5);

  const patientB = await rpc('hag_run_patient_context', { p_token: 'b'.repeat(48) });
  assert.equal(patientB.ok, true);
  assert.equal(patientB.program, null, 'patient B must receive only its own empty context');

  for (const token of ['x'.repeat(48), 'c'.repeat(48), 'd'.repeat(48)]) {
    const rejected = await rpc('hag_run_patient_context', { p_token: token });
    assert.equal(rejected.ok, false, 'invalid, revoked and expired tokens must not authorize');
    assert.equal(rejected.error, 'invalid_link');
  }

  const eventId = '77777777-7777-4777-8777-777777777777';
  const execution = {
    completed: false, duration_seconds: 300, distance_km: 0.5, rpe: 5,
    difficulty: 'easy', pain: 0, fatigue: 3, recovery: 'good',
  };
  const requests = await Promise.all([
    rpc('hag_run_patient_save_execution', {
      p_token: 'a'.repeat(48), p_client_event_id: eventId,
      p_session_id: 'synthetic-session-mon', p_execution: execution,
    }),
    rpc('hag_run_patient_save_execution', {
      p_token: 'a'.repeat(48), p_client_event_id: eventId,
      p_session_id: 'synthetic-session-mon', p_execution: execution,
    }),
  ]);
  assert.equal(requests[0].ok, true);
  assert.equal(requests[1].ok, true);
  assert.equal(requests[0].execution_id, requests[1].execution_id);
  assert.deepEqual(requests.map(result => result.duplicate).sort(), [false, true]);

  const restored = await rpc('hag_run_patient_context', { p_token: 'a'.repeat(48) });
  assert.equal(restored.history.length, 6, 'PostgREST must restore the single concurrent event');
  console.log('Supabase local PostgREST checks passed: token isolation, revocation, expiry, persistence and concurrent idempotency.');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
