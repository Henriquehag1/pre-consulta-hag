'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../hag_run_engine.js');

const base = {
  experience: 'new', maxContinuousMinutes: 0, runningDaysPerWeek: 0, weeklyKm: 0,
  longestRunKm: 0, habitualPaceSecondsPerKm: null, paceRpe: null,
  injuryHistory: '', recentInjury: false, activeInjury: false, currentPain: 0,
  concerningSymptoms: false, availableDays: ['mon', 'wed', 'sat'], goal: '5k', modality: 'road', recentResults: [],
};
const levels = [
  { level: 'R0', profile: { ...base } },
  { level: 'R1', profile: { ...base, maxContinuousMinutes: 10, weeklyKm: 3, runningDaysPerWeek: 2, longestRunKm: 1.5 } },
  { level: 'R2', profile: { ...base, maxContinuousMinutes: 15, weeklyKm: 8, runningDaysPerWeek: 2, longestRunKm: 2.5 } },
  { level: 'R3', profile: { ...base, maxContinuousMinutes: 30, weeklyKm: 12, runningDaysPerWeek: 2, longestRunKm: 4 } },
  { level: 'R4', profile: { ...base, maxContinuousMinutes: 25, weeklyKm: 14, runningDaysPerWeek: 3, longestRunKm: 5.1 } },
];

for (const { level, profile } of levels) {
  test(`${level} is reported as a provisional functional classification only`, () => {
    const result = engine.classifyRunner(profile, { asOf: '2026-10-27' });
    assert.equal(result.level, level);
    assert.equal(result.functionalClassificationOnly, true);
    assert.equal(result.eligibleForAutomaticPlan, false);
    assert.equal(result.requiresProfessionalReview, true);
  });

  test(`${level} cannot produce an executable plan before an approved matrix exists`, () => {
    const result = engine.generate5kWeek(profile, 1, { asOf: '2026-10-27' });
    assert.equal(result.classification.level, level);
    assert.equal(result.status, 'clinical_protocol_pending');
    assert.deepEqual(result.sessions, []);
    assert.equal(result.week, null);
  });
}

test('R5 is reserved for a future version and is absent from the active classification set', () => {
  const profile = { ...base, goal: 'improve_5k', maxContinuousMinutes: 40, weeklyKm: 24,
    runningDaysPerWeek: 4, longestRunKm: 8,
    recentResults: [{ distanceKm: 5, timeSeconds: 1500, date: '2026-10-20' }] };
  assert.deepEqual(engine.LEVELS, ['R0', 'R1', 'R2', 'R3', 'R4']);
  assert.notEqual(engine.classifyRunner(profile, { asOf: '2026-10-27' }).level, 'R5');
});

test('safety flags remain visible but do not activate an automatic fallback dose', () => {
  const result = engine.generate5kWeek({ ...levels[0].profile, recentInjury: true }, 1, { asOf: '2026-10-27' });
  assert.equal(result.classification.requiresProfessionalReview, true);
  assert.equal(result.status, 'clinical_protocol_pending');
  assert.equal(result.sessions.length, 0);
});

for (const scenario of [
  ['concluded and tolerated cycle', { completed: true, pain: 0, rpe: 3, fatigue: 1, recovery: 'good' }],
  ['incomplete session', { completed: false, pain: 0, rpe: 4, fatigue: 3, recovery: 'good' }],
  ['pain reported', { completed: true, pain: 2, rpe: 4, fatigue: 2, recovery: 'good' }],
  ['recovery reported insufficient', { completed: true, pain: 0, rpe: 4, fatigue: 8, recovery: 'poor' }],
  ['new symptoms', { completed: true, pain: 0, rpe: 3, fatigue: 1, recovery: 'good', concerningSymptoms: true }],
  ['new injury', { completed: true, pain: 0, rpe: 3, fatigue: 1, recovery: 'good', injuryDuringRun: true }],
]) {
  test(`legacy progress logic is disabled for ${scenario[0]}`, () => {
    const result = engine.recommendNext(scenario[1]);
    assert.equal(result.action, 'professional_review');
    assert.equal(result.progressAllowed, false);
  });
}

test('pace and treadmill speed conversions are reversible within rounding precision', () => {
  assert.equal(engine.paceToKmh(360), 10);
  assert.equal(engine.kmhToPace(10), 360);
  assert.equal(engine.paceToKmh(engine.kmhToPace(12)), 12);
});

test('functional input validation rejects fractional running-day counts', () => {
  assert.throws(() => engine.classifyRunner({ ...base, runningDaysPerWeek: 1.5 }), /integer/);
});

test('invalid result pace is rejected during functional assessment normalization', () => {
  const profile = { ...base, recentResults: [{ distanceKm: 3, timeSeconds: 180, date: '2026-10-20' }] };
  assert.throws(() => engine.classifyRunner(profile, { asOf: '2026-10-27' }), /2 and 30 minutes/);
});

test('post-run record calculates measured pace without determining clinical progression', () => {
  const record = engine.buildRunRecord({ completed: true, durationSeconds: 1800, distanceKm: 5,
    rpe: 5, difficulty: 'moderate', pain: 0, fatigue: 3, recovery: 'good', recordedAt: '2026-10-27T12:00:00Z' });
  assert.equal(record.paceSecondsPerKm, 360);
  assert.equal(record.pace, '6:00 min/km');
  assert.equal(engine.recommendNext(record).action, 'professional_review');
});

test('completed run requires positive time and distance and a valid timestamp', () => {
  assert.throws(() => engine.buildRunRecord({ completed: true, durationSeconds: 0, distanceKm: 1,
    rpe: 5, difficulty: 'moderate', pain: 0, fatigue: 3, recovery: 'good' }), RangeError);
  assert.throws(() => engine.buildRunRecord({ completed: true, durationSeconds: 600, distanceKm: 0,
    rpe: 4, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good' }), /distance/);
  assert.throws(() => engine.buildRunRecord({ completed: false, durationSeconds: 20, distanceKm: 1,
    rpe: 4, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good', recordedAt: 'invalid' }), /recordedAt/);
});
