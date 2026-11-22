/* Portal CEL: este endereço (…/recurso-professor/) mudou para …/portal-cel/.
   Este service worker substitui o antigo: apaga só o que era deste endereço, retira-se e leva as janelas abertas para o novo endereço. */
const NOVO = (u) => u.replace(/\/recurso-professor(\/|$)/, '/portal-cel/');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  try {
    for (const n of await caches.keys()) {
      const c = await caches.open(n);
      for (const r of await c.keys()) if (r.url.includes('/recurso-professor/')) await c.delete(r);
    }
  } catch (_) {}
  await self.clients.claim();
  const janelas = await self.clients.matchAll({ type: 'window' });
  await self.registration.unregister();
  for (const j of janelas) { try { await j.navigate(NOVO(j.url)); } catch (_) {} }
})()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') e.respondWith(Response.redirect(NOVO(e.request.url), 302));
});
