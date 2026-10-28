'use strict';

// Optional host adapter for the existing HAG OS authentication surface.
// The user access token remains in the HAG OS host and is never sent to the
// sandboxed iframe, placed in a URL, or written to persistent storage.
(function (root) {
  function mount(container, options = {}) {
    if (!container || typeof container.appendChild !== 'function') {
      throw new TypeError('Informe um contêiner do HAG OS para montar o painel HAG RUN.');
    }
    const panelUrl = new URL(options.panelUrl || 'hag_run_medico.html', root.location.href);
    if (panelUrl.origin !== root.location.origin || !['http:', 'https:'].includes(panelUrl.protocol)) {
      throw new Error('O painel médico deve ser carregado na mesma origem do HAG OS.');
    }
    const iframe = root.document.createElement('iframe');
    iframe.title = options.title || 'Painel médico HAG RUN';
    panelUrl.searchParams.set('hag_run_host_origin', root.location.origin);
    iframe.src = panelUrl.href;
    iframe.referrerPolicy = 'no-referrer';
    iframe.loading = 'lazy';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.cssText = 'width:100%;min-height:760px;border:0;border-radius:12px;background:#f8f7f4';

    function send(type, payload) {
      // The sandboxed panel has an opaque origin. `source` and the per-frame
      // channel are checked below; `*` is required only for this opaque target.
      iframe.contentWindow?.postMessage({ type, ...payload }, '*');
    }

    function safeBearer(value) {
      if (typeof value !== 'string' || /service[_-]?role/i.test(value)) return false;
      try {
        const part = value.split('.')[1];
        if (!part) return true;
        let normalized = part.replace(/-/g, '+').replace(/_/g, '/');
        normalized += '='.repeat((4 - normalized.length % 4) % 4);
        const decoded = root.atob(normalized);
        return JSON.parse(decoded).role !== 'service_role';
      } catch (_) { return false; }
    }

    async function callClinicianRpc(name, body) {
      if (!['hag_run_clinician_context', 'hag_run_clinician_review'].includes(name)) {
        throw new Error('rpc_not_allowed');
      }
      const auth = root.HAGAuth;
      const config = root.HAG_CFG || {};
      const accessToken = auth?.valid?.() ? auth.token?.() : null;
      const url = config.SUPA_URL || root.SUPABASE_URL || root.SUPA_URL || '';
      const anonKey = config.SUPA_KEY || root.SUPABASE_KEY || root.SUPA_KEY || '';
      if (!accessToken || !url || !anonKey || !safeBearer(accessToken) || !safeBearer(anonKey)) {
        throw new Error('authenticated_session_required');
      }
      const response = await root.fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let result;
      try { result = await response.json(); } catch (_) { result = null; }
      // HAG_RUN_INTEGRACAO_v1: repassa o codigo de recusa do servidor (ex.: restricted_instructions_required)
      // para o painel explicar o motivo. So o identificador curto, sem dados do paciente.
      if (!response.ok) {
        const code = typeof result?.message === 'string' && /^[a-z_]{3,80}$/.test(result.message) ? `:${result.message}` : '';
        throw new Error(`rpc_http_${response.status}${code}`);
      }
      return result;
    }

    async function handleMessage(event) {
      if (event.origin !== 'null' || event.source !== iframe.contentWindow) return;
      if (event.data?.type === 'HAG_RUN_REQUEST_CLINICIAN_SESSION') {
      const auth = root.HAGAuth;
      const config = root.HAG_CFG || {};
      const hasSession = auth?.valid?.() && safeBearer(auth.token?.());
      const anonKey = config.SUPA_KEY || root.SUPABASE_KEY || root.SUPA_KEY || '';
      if (!hasSession || !anonKey || !safeBearer(anonKey)) {
        send('HAG_RUN_CLINICIAN_SESSION_ERROR', { message: 'Entre no HAG OS para abrir a revisão clínica.' });
        return;
      }
      let patientId = typeof options.patientId === 'function' ? options.patientId() : options.patientId;
      if (patientId == null) patientId = root.HAGMotor?.paciente?.id || '';
      send('HAG_RUN_CLINICIAN_SESSION', { patientId: String(patientId || '') });
      return;
      }
      if (event.data?.type !== 'HAG_RUN_CLINICIAN_RPC_REQUEST') return;
      const requestId = event.data.requestId;
      if (typeof requestId !== 'string' || requestId.length > 120) return;
      try {
        const result = await callClinicianRpc(event.data.name, event.data.body);
        send('HAG_RUN_CLINICIAN_RPC_RESPONSE', { requestId, result });
      } catch (error) {
        send('HAG_RUN_CLINICIAN_RPC_RESPONSE', { requestId, error: String(error.message || 'rpc_failed') });
      }
    }

    root.addEventListener('message', handleMessage);
    container.appendChild(iframe);
    return {
      iframe,
      destroy() {
        root.removeEventListener('message', handleMessage);
        iframe.remove();
      },
    };
  }

  root.HAGRunHostBridge = Object.freeze({ mount });
})(window);
