/* HAG RUN deterministic prescription core. No storage or network side effects. */
'use strict';

const VERSION = 'hag-run-engine/0.1.0';
const LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'];

function finiteNumber(value, name, min, max, required = false) {
  if (value == null || value === '') {
    if (required) throw new TypeError(`${name} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new RangeError(`${name} must be between ${min} and ${max}`);
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
  const runningDays = finiteNumber(input.runningDaysPerWeek, 'runningDaysPerWeek', 0, 7, true);
  const longestRunKm = finiteNumber(input.longestRunKm, 'longestRunKm', 0, 60, true);
  const habitualPaceSecondsPerKm = finiteNumber(input.habitualPaceSecondsPerKm, 'habitualPaceSecondsPerKm', 120, 1800);
  const paceRpe = finiteNumber(input.paceRpe, 'paceRpe', 0, 10);
  const availableDays = Array.isArray(input.availableDays) ? [...new Set(input.availableDays)] : [];
  const allowedDays = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  if (availableDays.some(day => !allowedDays.has(day))) throw new RangeError('availableDays contains an invalid weekday');
  const goal = input.goal || '5k';
  if (!['5k', 'improve_5k', '10k', '15k', '21k', '42k', 'hyrox'].includes(goal)) throw new RangeError('goal is invalid');
  const modality = input.modality || 'road';
  if (!['road', 'track', 'treadmill'].includes(modality)) throw new RangeError('modality is invalid');
  const results = Array.isArray(input.recentResults) ? input.recentResults.map(result => ({
    distanceKm: finiteNumber(result.distanceKm, 'result.distanceKm', 1, 100, true),
    timeSeconds: finiteNumber(result.timeSeconds, 'result.timeSeconds', 60, 86400, true),
    date: result.date || null,
  })) : [];
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
    currentPain: finiteNumber(input.currentPain, 'currentPain', 0, 10) ?? 0,
    concerningSymptoms: Boolean(input.concerningSymptoms),
    availability: availableDays,
    goal,
    modality,
    recentResults: results,
  };
}

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
  if (p.goal === 'improve_5k' && usablePerformanceResult && p.runningDaysPerWeek >= 3 && p.weeklyKm >= 15 && p.longestRunKm >= 5) {
    level = 'R5';
  } else if ((hasRecent5k || p.longestRunKm >= 5) && p.runningDaysPerWeek >= 2 && p.weeklyKm >= 8) {
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
    eligibleForAutomaticPlan: reviewReasons.length === 0,
    requiresProfessionalReview: reviewReasons.length > 0,
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

function segment(type, seconds, paceSecondsPerKm, rpeTarget, modality) {
  const s = { type, seconds, rpeTarget };
  if (paceSecondsPerKm != null) {
    s.paceSecondsPerKm = Math.round(paceSecondsPerKm);
    s.pace = formatPace(paceSecondsPerKm);
    if (modality === 'treadmill') s.speedKmh = paceToKmh(paceSecondsPerKm);
  }
  return s;
}

function makeIntervals(runMinutes, recoveryMinutes, cycles, pace, rpe, modality) {
  const out = [];
  for (let i = 0; i < cycles; i++) {
    out.push(segment('run', runMinutes * 60, pace, rpe, modality));
    if (recoveryMinutes > 0) out.push(segment('walk', recoveryMinutes * 60, null, 2, modality));
  }
  return out;
}

const BEGINNER_STAGES = [
  [60, 90, 7], [60, 90, 7], [90, 90, 7], [90, 90, 7], [120, 120, 6], [120, 120, 6],
  [180, 120, 5], [180, 120, 5], [240, 120, 4], [240, 120, 4], [360, 120, 3], [600, 120, 2],
];
const R2_STAGES = [
  [180, 120, 5], [180, 120, 5], [240, 120, 4], [180, 120, 5],
  [300, 120, 3], [300, 120, 3], [600, 120, 2], [900, 120, 1],
];
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function chooseSpacedDays(available, maximum) {
  const sorted = [...available].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  // Brute-force the seven-day set so an early greedy choice cannot hide a
  // larger valid schedule. Prefer more recovery spacing when ties remain.
  let best = [];
  function search(start, chosen) {
    if (chosen.length > best.length) best = [...chosen];
    if (chosen.length === maximum) return;
    for (let i = start; i < sorted.length; i++) {
      const index = DAY_ORDER.indexOf(sorted[i]);
      if (chosen.every(day => {
        const otherIndex = DAY_ORDER.indexOf(day);
        const gap = Math.min((index - otherIndex + 7) % 7, (otherIndex - index + 7) % 7);
        return gap >= 2;
      })) search(i + 1, [...chosen, sorted[i]]);
    }
  }
  search(0, []);
  return best;
}

function sumSeconds(segments) { return segments.reduce((sum, item) => sum + item.seconds, 0); }

function makeSession({ id, title, segments, modality, level, objective, cautionReasons }) {
  return {
    id,
    title,
    level,
    objective,
    modality,
    segments,
    durationSeconds: sumSeconds(segments),
    durationMinutes: Math.ceil(sumSeconds(segments) / 60),
    cautionReasons: [...cautionReasons],
  };
}

function generate5kWeek(input, week = 1, options = {}) {
  const p = normalizeProfile(input);
  const asOf = options.asOf || input.assessmentDate || new Date().toISOString().slice(0, 10);
  const classification = classifyRunner(input, { asOf });
  if (!Number.isInteger(week) || week < 1 || week > 12) throw new RangeError('week must be an integer from 1 to 12');
  if (!classification.eligibleForAutomaticPlan) {
    return { engineVersion: VERSION, classification, status: 'professional_review', sessions: [], explanation: 'A avaliação profissional é necessária antes de gerar ou progredir a prescrição.' };
  }
  if (!['5k', 'improve_5k'].includes(p.goal)) throw new RangeError('generate5kWeek only accepts 5 km goals');
  if (p.availability.length === 0) return { engineVersion: VERSION, classification, status: 'incomplete_availability', sessions: [], explanation: 'Informe os dias disponíveis para corrida.' };

  const cap = p.habitualPaceSecondsPerKm;
  const easyPace = cap == null ? null : cap + (p.paceRpe != null && p.paceRpe > 4 ? 30 : 0);
  const desiredSessions = classification.level === 'R0' || classification.level === 'R1' ? 2 : 3;
  const workloadLimit = p.runningDaysPerWeek > 0 ? p.runningDaysPerWeek : (classification.level === 'R0' || classification.level === 'R1' ? 2 : 1);
  const days = chooseSpacedDays(p.availability, Math.min(desiredSessions, workloadLimit));
  if (days.length === 0) return { engineVersion: VERSION, classification, status: 'insufficient_recovery_days', sessions: [], explanation: 'Selecione dias com pelo menos um dia sem corrida entre as sessões.' };
  const sessions = [];
  const addEasy = (day, minutes, name = 'Corrida leve') => {
    const body = [segment('warmup_walk', 5 * 60, null, 2, p.modality), segment('run', minutes * 60, easyPace, 3, p.modality), segment('cooldown_walk', 5 * 60, null, 2, p.modality)];
    sessions.push({ day, ...makeSession({ id: `hag-run-${classification.level.toLowerCase()}-w${week}-${day}`, title: name, segments: body, modality: p.modality, level: classification.level, objective: 'Ritmo confortável, com esforço percebido baixo e controlado.', cautionReasons: classification.cautionReasons }) });
  };
  const addIntervals = (runSec, walkSec, cycles, day) => {
    const body = [segment('warmup_walk', 5 * 60, null, 2, p.modality), ...makeIntervals(runSec / 60, walkSec / 60, cycles, easyPace, 3, p.modality), segment('cooldown_walk', 5 * 60, null, 2, p.modality)];
    sessions.push({ day, ...makeSession({ id: `hag-run-${classification.level.toLowerCase()}-w${week}-${day}`, title: 'Corrida e caminhada', segments: body, modality: p.modality, level: classification.level, objective: 'Alternar corrida leve e caminhada sem ultrapassar o esforço indicado.', cautionReasons: classification.cautionReasons }) });
  };

  if (classification.level === 'R0' || classification.level === 'R1') {
    const [runSec, walkSec, cycles] = BEGINNER_STAGES[week - 1];
    days.forEach(day => addIntervals(runSec, walkSec, cycles, day));
  } else if (classification.level === 'R2') {
    const [runSec, walkSec, cycles] = R2_STAGES[Math.min(week, R2_STAGES.length) - 1];
    days.forEach((day, index) => addIntervals(runSec, walkSec, index === days.length - 1 ? Math.max(1, cycles - 1) : cycles, day));
  } else if (classification.level === 'R3') {
    const base = Math.min(35, Math.max(18, Math.floor(p.maxContinuousMinutes * 0.7)));
    const gain = Math.floor((week - 1) / 2) * 3;
    days.forEach((day, index) => addEasy(day, Math.min(base + gain + (index === days.length - 1 ? 5 : 0), 40), index === days.length - 1 ? 'Corrida contínua mais longa' : 'Corrida contínua leve'));
  } else if (classification.level === 'R4') {
    days.forEach((day, index) => {
      if (index === 1) addIntervals(180, 120, 4 + Math.floor((week - 1) / 3), day);
      else addEasy(day, index === days.length - 1 ? Math.min(45, 30 + week) : Math.min(35, 25 + Math.floor((week - 1) / 2)), index === days.length - 1 ? 'Corrida longa confortável' : 'Corrida leve');
    });
  } else {
    const asOfDate = new Date(asOf);
    const latestResult = p.recentResults
      .filter(r => r.distanceKm >= 3 && r.distanceKm <= 10 && r.date && (asOfDate - new Date(r.date)) <= 90 * 86400000 && (asOfDate - new Date(r.date)) >= 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const predicted5kTime = latestResult ? latestResult.timeSeconds * Math.pow(5 / latestResult.distanceKm, 1.06) : null;
    const racePace = predicted5kTime ? predicted5kTime / 5 : cap;
    days.forEach((day, index) => {
      if (index === 1) {
        const workPace = racePace == null ? null : racePace;
        const body = [segment('warmup_walk', 5 * 60, null, 2, p.modality), ...makeIntervals(3, 2, 5, workPace, 7, p.modality), segment('cooldown_walk', 5 * 60, null, 2, p.modality)];
        sessions.push({ day, ...makeSession({ id: `hag-run-r5-w${week}-${day}`, title: 'Intervalos em ritmo-alvo estimado de 5 km', segments: body, modality: p.modality, level: 'R5', objective: 'Ritmo-alvo estimado por resultado recente; confirmar esforço percebido e ajustar se não for controlado.', cautionReasons: classification.cautionReasons }) });
      } else addEasy(day, index === days.length - 1 ? Math.min(50, 35 + week) : 30, index === days.length - 1 ? 'Corrida longa confortável' : 'Corrida leve');
    });
  }

  return {
    engineVersion: VERSION,
    assessedAt: new Date(asOf).toISOString().slice(0, 10),
    classification,
    status: 'ready',
    goal: p.goal,
    week,
    plannedDays: sessions.map(s => s.day),
    progressionPolicy: 'A semana seguinte depende de tolerância e conclusão registradas; uma única sessão bem tolerada não avança o plano.',
    sessions,
  };
}

function recommendNext(input) {
  const log = input || {};
  const pain = finiteNumber(log.pain, 'pain', 0, 10, true);
  const rpe = finiteNumber(log.rpe, 'rpe', 0, 10, true);
  const fatigue = finiteNumber(log.fatigue, 'fatigue', 0, 10, true);
  const recovery = log.recovery;
  const history = Array.isArray(log.recentHistory) ? log.recentHistory.slice(-2) : [];
  if (log.concerningSymptoms || pain >= 4) return { action: 'professional_review', progressAllowed: false, reason: 'Sintoma relevante ou dor de intensidade alta. Interromper a sessão e solicitar avaliação profissional.' };
  if (log.injuryDuringRun || log.newInjury) return { action: 'professional_review', progressAllowed: false, reason: 'Nova lesão relatada durante ou após a corrida.' };
  if (!log.completed) return { action: 'repeat', progressAllowed: false, reason: 'Sessão não concluída. Repetir o estágio após revisar a causa da interrupção.' };
  if (pain > 0) return { action: 'maintain', progressAllowed: false, reason: 'Dor relatada. Manter ou reduzir a carga, sem progressão automática.' };
  if (fatigue >= 8 || recovery === 'poor' || rpe >= 9) return { action: 'reduce', progressAllowed: false, reason: 'Fadiga alta, recuperação ruim ou esforço muito alto.' };
  if (log.difficulty === 'hard' || rpe >= 8 || recovery === 'partial') return { action: 'maintain', progressAllowed: false, reason: 'Esforço alto ou recuperação parcial. Manter o estágio atual.' };
  const tolerated = [log, ...history].filter(x => x.completed && (x.pain ?? 0) === 0 && (x.rpe ?? 10) <= 6 && (x.fatigue ?? 10) < 8 && x.recovery === 'good');
  if (tolerated.length >= 2) return { action: 'progress', progressAllowed: true, reason: 'Duas sessões recentes foram concluídas com boa tolerância.' };
  return { action: 'repeat', progressAllowed: false, reason: 'Aguardar outra sessão bem tolerada antes de progredir.' };
}

function buildRunRecord(input) {
  if (!input || typeof input !== 'object') throw new TypeError('run log is required');
  if (typeof input.completed !== 'boolean') throw new TypeError('completed is required');
  const durationSeconds = Math.round(finiteNumber(input.durationSeconds, 'durationSeconds', 0, 86400, true));
  const distanceKm = finiteNumber(input.distanceKm, 'distanceKm', 0, 100, true);
  const rpe = finiteNumber(input.rpe, 'rpe', 0, 10, true);
  const pain = finiteNumber(input.pain, 'pain', 0, 10, true);
  const fatigue = finiteNumber(input.fatigue, 'fatigue', 0, 10, true);
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
