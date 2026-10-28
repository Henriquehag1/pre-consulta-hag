/* HAG RUN functional assessment and run-record utilities. No dose activation until protocol approval. */
'use strict';

const VERSION = 'hag-run-engine/0.2.0-clinical-gate';
const LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'];

function finiteNumber(value, name, min, max, required = false) {
  if (value == null || value === '') {
    if (required) throw new TypeError(`${name} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(`${name} must be between ${min} and ${max}`);
  return n;
}

function integerNumber(value, name, min, max, required = false) {
  const n = finiteNumber(value, name, min, max, required);
  if (n != null && !Number.isInteger(n)) throw new RangeError(`${name} must be an integer`);
  return n;
}

function paceToKmh(secondsPerKm) {
  const pace = finiteNumber(secondsPerKm, 'paceSecondsPerKm', 120, 1800, true);
  return Math.round((3600 / pace) * 100) / 100;
}

function kmhToPace(speedKmh) {
  const speed = finiteNumber(speedKmh, 'speedKmh', 2, 30, true);
  return Math.round(3600 / speed);
}

function formatPace(secondsPerKm) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return null;
  const sec = Math.round(secondsPerKm);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min/km`;
}

function normalizeProfile(input) {
  if (!input || typeof input !== 'object') throw new TypeError('profile is required');
  const continuous = finiteNumber(input.maxContinuousMinutes, 'maxContinuousMinutes', 0, 300, true);
  const weeklyKm = finiteNumber(input.weeklyKm, 'weeklyKm', 0, 300, true);
  const runningDays = integerNumber(input.runningDaysPerWeek, 'runningDaysPerWeek', 0, 7, true);
  const longestRunKm = finiteNumber(input.longestRunKm, 'longestRunKm', 0, 60, true);
  const habitualPaceSecondsPerKm = finiteNumber(input.habitualPaceSecondsPerKm, 'habitualPaceSecondsPerKm', 120, 1800);
  const paceRpe = integerNumber(input.paceRpe, 'paceRpe', 0, 10);
  const availableDays = Array.isArray(input.availableDays) ? [...new Set(input.availableDays)] : [];
  const allowedDays = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  if (availableDays.some(day => !allowedDays.has(day))) throw new RangeError('availableDays contains an invalid weekday');
  const goal = input.goal || '5k';
  if (!['5k', 'improve_5k', '10k', '15k', '21k', '42k', 'hyrox'].includes(goal)) throw new RangeError('goal is invalid');
  const modality = input.modality || 'road';
  if (!['road', 'track', 'treadmill'].includes(modality)) throw new RangeError('modality is invalid');
  const results = Array.isArray(input.recentResults) ? input.recentResults.map(result => {
    const distanceKm = finiteNumber(result.distanceKm, 'result.distanceKm', 1, 100, true);
    const timeSeconds = finiteNumber(result.timeSeconds, 'result.timeSeconds', 60, 86400, true);
    if (timeSeconds / distanceKm < 120 || timeSeconds / distanceKm > 1800) {
      throw new RangeError('result pace must be between 2 and 30 minutes per km');
    }
    return { distanceKm, timeSeconds, date: result.date || null };
  }) : [];
  return {
    maxContinuousMinutes: continuous,
    weeklyKm,
    runningDaysPerWeek: runningDays,
    longestRunKm,
    habitualPaceSecondsPerKm,
    paceRpe,
    experience: input.experience || 'unknown',
    injuryHistory: input.injuryHistory || '',
    recentInjury: Boolean(input.recentInjury),
    activeInjury: Boolean(input.activeInjury),
    currentPain: integerNumber(input.currentPain, 'currentPain', 0, 10) ?? 0,
    concerningSymptoms: Boolean(input.concerningSymptoms),
    availability: availableDays,
    goal,
    modality,
    recentResults: results,
  };
}

// The existing R0-R4 cutoffs are provisional labels only; never treat them as clearance or dose selection.
function classifyRunner(input, options = {}) {
  const p = normalizeProfile(input);
  const asOf = options.asOf || input.assessmentDate ? new Date(options.asOf || input.assessmentDate) : new Date();
  if (Number.isNaN(asOf.getTime())) throw new TypeError('asOf must be a valid date');
  const datedResults = p.recentResults
    .filter(r => r.date && !Number.isNaN(new Date(r.date).getTime()))
    .filter(r => (asOf - new Date(r.date)) / 86400000 <= 90 && (asOf - new Date(r.date)) >= 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentResult = datedResults[0] || null;
  const usablePerformanceResult = datedResults.find(r => r.distanceKm >= 3 && r.distanceKm <= 10) || null;
  const hasRecent5k = datedResults.some(r => r.distanceKm >= 5 && r.distanceKm <= 10);
  let level;
  if ((hasRecent5k || p.longestRunKm >= 5) && p.runningDaysPerWeek >= 2 && p.weeklyKm >= 8) {
    level = 'R4';
  } else if (p.maxContinuousMinutes >= 30) {
    level = 'R3';
  } else if (p.maxContinuousMinutes >= 15) {
    level = 'R2';
  } else if (p.maxContinuousMinutes >= 5) {
    level = 'R1';
  } else {
    level = 'R0';
  }

  const reviewReasons = [];
  if (p.concerningSymptoms) reviewReasons.push('Sintomas cardiovasculares ou sistêmicos relatados');
  if (p.activeInjury || p.recentInjury) reviewReasons.push('Lesão ativa ou recente');
  if (p.currentPain >= 4) reviewReasons.push('Dor atual de intensidade relevante');
  const cautionReasons = [];
  if (p.currentPain > 0 && p.currentPain < 4) cautionReasons.push('Dor atual: não progredir automaticamente');
  if (p.injuryHistory && !p.recentInjury && !p.activeInjury) cautionReasons.push('Histórico de lesão informado');

  return {
    engineVersion: VERSION,
    level,
    functionalClassificationOnly: true,
    eligibleForAutomaticPlan: false,
    requiresProfessionalReview: true,
    reviewReasons,
    cautionReasons,
    evidence: {
      maxContinuousMinutes: p.maxContinuousMinutes,
      weeklyKm: p.weeklyKm,
      runningDaysPerWeek: p.runningDaysPerWeek,
      longestRunKm: p.longestRunKm,
      recentResultDistanceKm: usablePerformanceResult?.distanceKm ?? recentResult?.distanceKm ?? null,
      recentResultDate: usablePerformanceResult?.date ?? recentResult?.date ?? null,
      performanceResultUsable: Boolean(usablePerformanceResult),
    },
  };
}

function generate5kWeek(input, week = null, options = {}) {
  const asOf = options.asOf || input?.assessmentDate || new Date().toISOString().slice(0, 10);
  const classification = classifyRunner(input, { asOf });
  return {
    engineVersion: VERSION,
    classification,
    status: 'clinical_protocol_pending',
    sessions: [],
    week: null,
    requestedStage: week,
    explanation: 'As matrizes e os critérios quantitativos ainda não foram aprovados para prescrição automática. Solicite um plano individual ao profissional responsável.',
  };
}

function recommendNext() {
  return {
    action: 'professional_review',
    progressAllowed: false,
    reason: 'Os critérios clínicos de progressão, manutenção e redução ainda não estão autorizados para automação.',
  };
}

function buildRunRecord(input) {
  if (!input || typeof input !== 'object') throw new TypeError('run log is required');
  if (typeof input.completed !== 'boolean') throw new TypeError('completed is required');
  const durationSeconds = Math.round(finiteNumber(input.durationSeconds, 'durationSeconds', 0, 86400, true));
  const distanceKm = finiteNumber(input.distanceKm, 'distanceKm', 0, 100, true);
  const rpe = integerNumber(input.rpe, 'rpe', 0, 10, true);
  const pain = integerNumber(input.pain, 'pain', 0, 10, true);
  const fatigue = integerNumber(input.fatigue, 'fatigue', 0, 10, true);
  const difficulty = input.difficulty;
  const recovery = input.recovery;
  if (!['easy', 'moderate', 'hard'].includes(difficulty)) throw new RangeError('difficulty is invalid');
  if (!['good', 'partial', 'poor'].includes(recovery)) throw new RangeError('recovery is invalid');
  if (input.completed && durationSeconds <= 0) throw new RangeError('completed run requires positive duration');
  if (input.completed && distanceKm <= 0) throw new RangeError('completed run requires positive distance');
  if (!input.completed && durationSeconds === 0 && distanceKm > 0) throw new RangeError('distance cannot be recorded without elapsed time');
  if (input.sessionId != null && (typeof input.sessionId !== 'string' || input.sessionId.length > 120)) throw new RangeError('sessionId is invalid');
  if (input.prescriptionId != null && (typeof input.prescriptionId !== 'string' || input.prescriptionId.length > 120)) throw new RangeError('prescriptionId is invalid');
  const recordedAt = input.recordedAt || new Date().toISOString();
  if (Number.isNaN(new Date(recordedAt).getTime())) throw new TypeError('recordedAt must be a valid date');
  const paceSecondsPerKm = distanceKm > 0 && durationSeconds > 0 ? Math.round(durationSeconds / distanceKm) : null;
  return {
    engineVersion: VERSION,
    sessionId: input.sessionId || null,
    prescriptionId: input.prescriptionId || null,
    completed: input.completed,
    durationSeconds,
    distanceKm,
    rpe,
    difficulty,
    pain,
    fatigue,
    recovery,
    concerningSymptoms: Boolean(input.concerningSymptoms),
    injuryDuringRun: Boolean(input.injuryDuringRun),
    paceSecondsPerKm,
    pace: paceSecondsPerKm ? formatPace(paceSecondsPerKm) : null,
    recordedAt: new Date(recordedAt).toISOString(),
  };
}

const api = { VERSION, LEVELS, paceToKmh, kmhToPace, formatPace, normalizeProfile, classifyRunner, generate5kWeek, recommendNext, buildRunRecord };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.HAGRunEngine = api;
