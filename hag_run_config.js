'use strict';
// HAG_RUN_INTEGRACAO_v1 (28/10/2026): configuracao publica do HAG RUN no navegador do paciente.
// Mesma URL e mesma chave publicavel (anon) que o treino_HAG.html ja usa. Nao e segredo: o servidor
// so responde ao token pessoal valido. Nunca colocar aqui chave service_role (o store recusa).
// Testes e ambiente de desenvolvimento definem window.HAG_RUN_CONFIG antes deste arquivo.
window.HAG_RUN_CONFIG = window.HAG_RUN_CONFIG || Object.freeze({
  url: 'https://yutcnphwovqeiwcwzzhs.supabase.co',
  anonKey: 'sb_publishable_V-tdeq_qDKLAPYzN2vQuMA_okwPaOPi',
});
