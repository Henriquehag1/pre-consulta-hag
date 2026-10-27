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

test('R0 classifies sedentary non-runner from functional capacity and weekly volume', () => {
  const result = engine.classifyRunner(base, { asOf: '2026-10-27' });
  assert.equal(result.level, 'R0');
  assert.equal(result.eligibleForAutomaticPlan, true);
});

test('R1 classifies run-walk beginner by measured continuous duration', () => {
  assert.equal(engine.classifyRunner({ ...base, maxContinuousMinutes: 10, weeklyKm: 3, runningDaysPerWeek: 2, longestRunKm: 1.5 }).level, 'R1');
});

test('R2 classifies a runner who can sustain 15 minutes', () => {
  assert.equal(engine.classifyRunner({ ...base, maxContinuousMinutes: 15, weeklyKm: 8, runningDaysPerWeek: 2, longestRunKm: 2.5 }).level, 'R2');
});

test('R3 classifies 30 minutes continuous without a recent 5 km result', () => {
  assert.equal(engine.classifyRunner({ ...base, maxContinuousMinutes: 30, weeklyKm: 12, runningDaysPerWeek: 2, longestRunKm: 4 }).level, 'R3');
});

test('R4 classifies a completed 5 km without relying on pace', () => {
  const profile = { ...base, maxContinuousMinutes: 25, weeklyKm: 14, runningDaysPerWeek: 3, longestRunKm: 5.1,
    recentResults: [{ distanceKm: 5, timeSeconds: 1800, date: '2026-10-01' }] };
  assert.equal(engine.classifyRunner(profile, { asOf: '2026-10-27' }).level, 'R4');
});

test('R5 requires a recent result, goal to improve, and multiple workload indicators', () => {
  const profile = { ...base, goal: 'improve_5k', maxContinuousMinutes: 35, weeklyKm: 20, runningDaysPerWeek: 3, longestRunKm: 6,
    recentResults: [{ distanceKm: 5, timeSeconds: 1500, date: '2026-10-01' }] };
  assert.equal(engine.classifyRunner(profile, { asOf: '2026-10-27' }).level, 'R5');
});

test('R5 accepts a recent 3 km or 10 km test as performance evidence', () => {
  for (const distanceKm of [3, 10]) {
    const profile = { ...base, goal: 'improve_5k', maxContinuousMinutes: 35, weeklyKm: 20,
      runningDaysPerWeek: 3, longestRunKm: 6,
      recentResults: [{ distanceKm, timeSeconds: distanceKm === 3 ? 840 : 3300, date: '2026-10-01' }] };
    assert.equal(engine.classifyRunner(profile, { asOf: '2026-10-27' }).level, 'R5');
  }
});

test('recent injury blocks automatic prescription', () => {
  const result = engine.generate5kWeek({ ...base, recentInjury: true }, 1);
  assert.equal(result.status, 'professional_review');
  assert.equal(result.sessions.length, 0);
});

test('non-completion recommends repeat and prevents progression', () => {
  const result = engine.recommendNext({ completed: false, pain: 0, rpe: 5, fatigue: 3, recovery: 'good' });
  assert.equal(result.action, 'repeat');
  assert.equal(result.progressAllowed, false);
});

test('high fatigue recommends reducing load', () => {
  const result = engine.recommendNext({ completed: true, pain: 0, rpe: 7, fatigue: 9, recovery: 'partial' });
  assert.equal(result.action, 'reduce');
  assert.equal(result.progressAllowed, false);
});

test('pain prevents automatic progression and high pain requires review', () => {
  assert.equal(engine.recommendNext({ completed: true, pain: 2, rpe: 5, fatigue: 3, recovery: 'good' }).action, 'maintain');
  assert.equal(engine.recommendNext({ completed: true, pain: 5, rpe: 5, fatigue: 3, recovery: 'good' }).action, 'professional_review');
});

test('treadmill prescription exposes pace and matching speed', () => {
  const result = engine.generate5kWeek({ ...base, maxContinuousMinutes: 20, weeklyKm: 10, runningDaysPerWeek: 2,
    longestRunKm: 3, habitualPaceSecondsPerKm: 360, paceRpe: 3, modality: 'treadmill' }, 1);
  const running = result.sessions.flatMap(s => s.segments).find(s => s.type === 'run');
  assert.equal(running.pace, '6:00 min/km');
  assert.equal(running.speedKmh, 10);
});

test('R5 target pace is derived from the recent race result with a fixed assessment date', () => {
  const profile = { ...base, goal: 'improve_5k', maxContinuousMinutes: 35, weeklyKm: 20,
    runningDaysPerWeek: 3, longestRunKm: 6,
    recentResults: [{ distanceKm: 10, timeSeconds: 3300, date: '2026-10-01' }] };
  const result = engine.generate5kWeek(profile, 1, { asOf: '2026-10-27' });
  assert.equal(result.classification.level, 'R5');
  const work = result.sessions[1].segments.find(s => s.type === 'run' && s.rpeTarget === 7);
  assert.equal(work.paceSecondsPerKm, Math.round((3300 * Math.pow(5 / 10, 1.06)) / 5));
});

test('pace and speed conversions are inverses within rounding precision', () => {
  assert.equal(engine.paceToKmh(360), 10);
  assert.equal(engine.kmhToPace(10), 360);
  assert.equal(engine.paceToKmh(engine.kmhToPace(12)), 12);
});

test('interval duration adds exactly to warm-up, work, recovery, and cool-down', () => {
  const result = engine.generate5kWeek(base, 1);
  const first = result.sessions[0];
  const expected = 5 * 60 + (7 * (60 + 90)) + 5 * 60;
  assert.equal(first.durationSeconds, expected);
  assert.equal(first.segments.reduce((sum, s) => sum + s.seconds, 0), expected);
});

test('sessions are spaced to preserve a non-running recovery day', () => {
  const result = engine.generate5kWeek({ ...base, maxContinuousMinutes: 20, weeklyKm: 10, runningDaysPerWeek: 2,
    longestRunKm: 3, availableDays: ['tue', 'wed', 'thu'] }, 1);
  assert.deepEqual(result.plannedDays, ['tue', 'thu']);
});

test('session count does not exceed the current weekly running frequency', () => {
  const result = engine.generate5kWeek({ ...base, maxContinuousMinutes: 30, weeklyKm: 15,
    runningDaysPerWeek: 2, longestRunKm: 4, availableDays: ['mon', 'wed', 'fri', 'sun'] }, 1);
  assert.equal(result.sessions.length, 2);
});

test('two tolerated sessions allow progression; one does not', () => {
  const good = { completed: true, pain: 0, rpe: 5, fatigue: 3, recovery: 'good' };
  assert.equal(engine.recommendNext({ ...good, recentHistory: [good] }).action, 'progress');
  assert.equal(engine.recommendNext({ ...good, recentHistory: [] }).action, 'repeat');
});

test('only the immediately previous tolerated session can authorize progression', () => {
  const good = { completed: true, pain: 0, rpe: 5, fatigue: 3, recovery: 'good' };
  const interrupted = { ...good, completed: false };
  const poorRecovery = { ...good, recovery: 'poor' };
  assert.equal(engine.recommendNext({ ...good, recentHistory: [good, interrupted] }).action, 'repeat');
  assert.equal(engine.recommendNext({ ...good, recentHistory: [good, poorRecovery] }).action, 'repeat');
  assert.equal(engine.recommendNext({ ...good, recentHistory: [interrupted, good] }).action, 'progress');
});

test('invalid fractional weekly frequency and malformed recovery records are rejected', () => {
  assert.throws(() => engine.classifyRunner({ ...base, runningDaysPerWeek: 1.5 }), /integer/);
  const valid = { completed: true, pain: 0, rpe: 5, fatigue: 3, recovery: 'good' };
  assert.throws(() => engine.recommendNext({ ...valid, completed: 'false' }), /boolean/);
  assert.throws(() => engine.recommendNext({ ...valid, recovery: 'unknown' }), /recovery/);
  assert.throws(() => engine.recommendNext({ ...valid, rpe: 5.5 }), /integer/);
});

test('R5 ignores a predicted pace outside the supported range instead of emitting an invalid treadmill speed', () => {
  const profile = { ...base, goal: 'improve_5k', maxContinuousMinutes: 35, weeklyKm: 20,
    runningDaysPerWeek: 3, longestRunKm: 6, modality: 'treadmill', habitualPaceSecondsPerKm: 600,
    recentResults: [{ distanceKm: 3, timeSeconds: 5400, date: '2026-10-20' }] };
  const result = engine.generate5kWeek(profile, 1, { asOf: '2026-10-27' });
  const work = result.sessions[1].segments.find(s => s.type === 'run' && s.rpeTarget === 7);
  assert.equal(work.paceSecondsPerKm, 600);
  assert.equal(work.speedKmh, 6);
  assert.throws(() => engine.classifyRunner({ ...profile,
    recentResults: [{ distanceKm: 3, timeSeconds: 180, date: '2026-10-20' }] }, { asOf: '2026-10-27' }), /2 and 30 minutes/);
});

test('capacity differences generate distinct sessions for the same 5 km goal', () => {
  const novice = engine.generate5kWeek(base, 1);
  const established = engine.generate5kWeek({ ...base, maxContinuousMinutes: 30, weeklyKm: 15,
    runningDaysPerWeek: 3, longestRunKm: 4, availableDays: ['mon', 'wed', 'fri'] }, 1);
  assert.notDeepEqual(novice.sessions[0].segments, established.sessions[0].segments);
  assert.notEqual(novice.classification.level, established.classification.level);
});

test('post-run record calculates actual pace from duration and distance', () => {
  const record = engine.buildRunRecord({ completed: true, durationSeconds: 1800, distanceKm: 5,
    rpe: 5, difficulty: 'moderate', pain: 0, fatigue: 3, recovery: 'good', recordedAt: '2026-10-27T12:00:00Z' });
  assert.equal(record.paceSecondsPerKm, 360);
  assert.equal(record.pace, '6:00 min/km');
});

test('post-run record rejects completed sessions with zero duration', () => {
  assert.throws(() => engine.buildRunRecord({ completed: true, durationSeconds: 0, distanceKm: 1,
    rpe: 5, difficulty: 'moderate', pain: 0, fatigue: 3, recovery: 'good' }), RangeError);
});

test('all runner levels receive individualized 5 km sessions with exact segment totals', () => {
  const profiles = [
    { ...base },
    { ...base, maxContinuousMinutes: 8, runningDaysPerWeek: 2, weeklyKm: 3 },
    { ...base, maxContinuousMinutes: 18, runningDaysPerWeek: 2, weeklyKm: 8, longestRunKm: 2 },
    { ...base, maxContinuousMinutes: 32, runningDaysPerWeek: 3, weeklyKm: 14, longestRunKm: 4 },
    { ...base, maxContinuousMinutes: 32, runningDaysPerWeek: 3, weeklyKm: 16, longestRunKm: 5.5 },
    { ...base, goal: 'improve_5k', maxContinuousMinutes: 38, runningDaysPerWeek: 4, weeklyKm: 24, longestRunKm: 8,
      recentResults: [{ distanceKm: 5, timeSeconds: 1500, date: '2026-10-20' }] },
  ];
  for (let i = 0; i < profiles.length; i++) {
    const result = engine.generate5kWeek(profiles[i], 1, { asOf: '2026-10-27' });
    assert.equal(result.classification.level, `R${i}`);
    assert.equal(result.status, 'ready');
    assert.ok(result.sessions.length >= 1);
    for (const session of result.sessions) {
      assert.equal(session.durationSeconds, session.segments.reduce((sum, item) => sum + item.seconds, 0));
      assert.ok(session.segments.every(item => Number.isInteger(item.seconds) && item.seconds > 0));
    }
  }
});

test('schedule search finds the maximum nonconsecutive set without greedy bias', () => {
  const result = engine.generate5kWeek({ ...base, maxContinuousMinutes: 30, runningDaysPerWeek: 3, weeklyKm: 12,
    availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'] }, 1, { asOf: '2026-10-27' });
  assert.equal(result.sessions.length, 3);
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const indices = result.plannedDays.map(day => order.indexOf(day));
  for (let i = 1; i < indices.length; i++) assert.ok(indices[i] - indices[i - 1] >= 2);
});

test('R5 selects the latest qualifying race even when a newer short test exists', () => {
  const result = engine.classifyRunner({ ...base, goal: 'improve_5k', maxContinuousMinutes: 40,
    runningDaysPerWeek: 4, weeklyKm: 24, longestRunKm: 8,
    recentResults: [{ distanceKm: 5, timeSeconds: 1500, date: '2026-10-20' },
      { distanceKm: 1, timeSeconds: 270, date: '2026-10-24' }] }, { asOf: '2026-10-27' });
  assert.equal(result.level, 'R5');
  assert.equal(result.evidence.recentResultDistanceKm, 5);
});

test('expired and future race results are excluded from R5 evidence', () => {
  for (const date of ['2026-07-28', '2026-10-28']) {
    const result = engine.classifyRunner({ ...base, goal: 'improve_5k', maxContinuousMinutes: 40,
      runningDaysPerWeek: 4, weeklyKm: 24, longestRunKm: 8,
      recentResults: [{ distanceKm: 5, timeSeconds: 1500, date }] }, { asOf: '2026-10-27' });
    assert.notEqual(result.level, 'R5');
  }
});

test('partial recovery or non-completion in recent history cannot authorize progression', () => {
  const current = { completed: true, pain: 0, rpe: 5, fatigue: 3, recovery: 'good' };
  const partial = { ...current, recovery: 'partial' };
  const incomplete = { ...current, completed: false };
  assert.equal(engine.recommendNext({ ...current, recentHistory: [partial] }).action, 'repeat');
  assert.equal(engine.recommendNext({ ...current, recentHistory: [incomplete] }).action, 'repeat');
  assert.equal(engine.recommendNext({ ...current, recentHistory: [{ ...current, recovery: 'poor' }] }).action, 'repeat');
});

test('concerning symptoms and new injury always require professional review', () => {
  for (const event of [{ concerningSymptoms: true }, { injuryDuringRun: true }, { newInjury: true }]) {
    const result = engine.recommendNext({ completed: true, pain: 0, rpe: 4, fatigue: 2, recovery: 'good', ...event });
    assert.equal(result.action, 'professional_review');
    assert.equal(result.progressAllowed, false);
  }
});

test('completed run requires a positive distance and recorded timestamp must be valid', () => {
  assert.throws(() => engine.buildRunRecord({ completed: true, durationSeconds: 600, distanceKm: 0,
    rpe: 4, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good' }), /distance/);
  assert.throws(() => engine.buildRunRecord({ completed: false, durationSeconds: 20, distanceKm: 1,
    rpe: 4, difficulty: 'easy', pain: 0, fatigue: 2, recovery: 'good', recordedAt: 'invalid' }), /recordedAt/);
});

