/* RPC gateway para links pessoais do HAG Treino. Nunca recebe patient_id do cliente. */
'use strict';

function validLinkToken(value) {
  return typeof value === 'string' && value.length >= 32 && value.length <= 128 && /^[a-f0-9]+$/i.test(value);
}

function isServiceRoleKey(value) {
  if (typeof value !== 'string') return false;
  if (/service[_-]?role/i.test(value)) return true;
  try {
    const payload = value.split('.')[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = typeof atob === 'function' ? atob(normalized) : Buffer.from(normalized, 'base64').toString('utf8');
    return JSON.parse(decoded).role === 'service_role';
  } catch (_) { return false; }
}

function createRunStore(config, fetchImpl = fetch) {
  if (!config || !config.url || !config.anonKey || !validLinkToken(config.token)) {
    return { available: false, reason: 'Abra o HAG RUN pelo link pessoal válido do HAG Treino.' };
  }
  if (isServiceRoleKey(config.anonKey)) {
    return { available: false, reason: 'A chave configurada não pode ser usada no navegador.' };
  }
  const base = config.url.replace(/\/$/, '');

  async function rpc(name, body) {
    const response = await fetchImpl(`${base}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Não foi possível sincronizar o HAG RUN (${response.status}).`);
    const result = await response.json();
    if (!result || result.ok === false) {
      if (result?.error === 'invalid_link') throw new Error('Link inválido, expirado ou revogado. Solicite um novo link à equipe.');
      throw new Error(`O Supabase recusou os dados do HAG RUN (${result?.error || 'resposta inválida'}).`);
    }
    return result;
  }

  return {
    available: true,
    async load() {
      const context = await rpc('hag_run_patient_context', { p_token: config.token });
      return context;
    },
    async saveAssessment(program, prescription, profile, assessment = profile) {
      const result = await rpc('hag_run_patient_save_assessment', {
        p_token: config.token,
        p_assessment: assessment,
        p_profile: { inputs: profile, functional: prescription.classification },
        p_program: { slug: program.slug, title: program.title, goal: profile.goal },
        p_prescription: {
          engine_version: prescription.engineVersion,
          plan: prescription,
        },
      });
      if (!result.program_id || !result.prescription_id) throw new Error('O Supabase não confirmou avaliação e prescrição.');
      return result;
    },
    async saveExecution(program, prescription, execution) {
      const result = await rpc('hag_run_patient_save_execution', {
        p_token: config.token,
        p_client_event_id: execution.clientEventId,
        p_session_id: execution.sessionId,
        p_execution: {
          completed: execution.completed,
          duration_seconds: execution.durationSeconds,
          distance_km: execution.distanceKm,
          rpe: execution.rpe,
          difficulty: execution.difficulty,
          pain: execution.pain,
          fatigue: execution.fatigue,
          recovery: execution.recovery,
          concerning_symptoms: execution.concerningSymptoms,
          injury_during_run: execution.injuryDuringRun,
          details: {
            program: { slug: program.slug, title: program.title },
            prescription: { engineVersion: prescription.engineVersion, week: prescription.week },
            paceSecondsPerKm: execution.paceSecondsPerKm,
          },
        },
      });
      if (!result.execution_id) throw new Error('O Supabase não confirmou a gravação da execução.');
      return result;
    },
  };
}

const HAGRunStore = { createRunStore, validLinkToken, isServiceRoleKey };
if (typeof module !== 'undefined' && module.exports) module.exports = HAGRunStore;
if (typeof window !== 'undefined') window.HAGRunStore = HAGRunStore;
