/* ============================================================================
   HAG OS - Service worker da Fila de Agendamento (HAG_PUSH_JULIA_v1)
   ----------------------------------------------------------------------------
   Existe para receber notificacao com a pagina fechada. No iPhone isso so
   funciona se a fila estiver adicionada a tela de inicio, e nao apenas aberta
   no Safari; e a permissao precisa ser aceita uma vez, a partir de um toque.
   ========================================================================== */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  var d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (e) { d = { corpo: (event.data && event.data.text()) || '' }; }
  var titulo = d.titulo || 'Fila de Agendamento';
  var opcoes = {
    body: d.corpo || 'Novidade na fila.',
    icon: 'icone-192.png',
    badge: 'icone-192.png',
    tag: d.tag || 'hag-fila',
    renotify: true,
    data: { url: d.url || 'julia_fila.html' }
  };
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var alvo = (event.notification.data && event.notification.data.url) || 'julia_fila.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(lista){
      for (var i = 0; i < lista.length; i++){
        if (lista[i].url.indexOf('julia_fila') >= 0 && 'focus' in lista[i]) return lista[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(alvo);
    })
  );
});
