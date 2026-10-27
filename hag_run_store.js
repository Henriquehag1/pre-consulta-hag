/* Persistência opcional. Nunca aceita chave de serviço nem identidade enviada pelo formulário. */
'use strict';

function decodeSubject(jwt) {
  try {
    const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = typeof atob === 'function' ? atob(payload) : Buffer.from(payload, 'base64').toString('utf8');
    const claims = JSON.parse(decoded);
    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null;
  } catch (_) { return null; }
}

function createRunStore(config, fetchImpl = fetch) {
  if (!config || !config.url || !config.anonKey || typeof config.getAccessToken !== 'function') {
    return { available: false, reason: 'Ambiente de desenvolvimento autenticado não configurado.' };
  }
  const base = config.url.replace(/\/$/, '');
  async function request(table, method, body, query = '', prefer = 'return=representation') {
    const token = await config.getAccessToken();
    const userId = decodeSubject(token || '');
    if (!userId) throw new Error('Entre com uma conta autenticada para salvar o HAG RUN.');
    const response = await fetchImpl(`${base}/rest/v1/${table}${query}`, {
      method,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
      },
      body: body == null ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Não foi possível salvar no Supabase (${response.status}).`);
    return response.status === 204 ? null : response.json();
  }
  return {
    available: true,
    async save(program, prescription, execution) {
      const result = await request('rpc/hag_run_save', 'POST', {
        p_program: { slug: program.slug, title: program.title, goal: program.goal },
        p_prescription: {
          engine_version: prescription.engineVersion,
          assessment: prescription.assessment,
          plan: prescription.plan,
        },
        p_execution: {
          session_id: execution.sessionId,
          completed: execution.completed,
          duration_seconds: execution.durationSeconds,
          distance_km: execution.distanceKm,
          rpe: execution.rpe,
          difficulty: execution.difficulty,
          pain: execution.pain,
          fatigue: execution.fatigue,
          recovery: execution.recovery,
          details: execution,
        },
      });
      if (!result?.program_id || !result?.prescription_id || !result?.execution_id) {
        throw new Error('O Supabase não confirmou a gravação completa da sessão.');
      }
      return result;
    },
  };
}

const HAGRunStore = { createRunStore, decodeSubject };
if (typeof module !== 'undefined' && module.exports) module.exports = HAGRunStore;
if (typeof window !== 'undefined') window.HAGRunStore = HAGRunStore;
