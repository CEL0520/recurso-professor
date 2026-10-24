/* Códigos CEL — área da coordenação: guarda a página neste aparelho para abrir sem internet. */
const VERSAO = '1.2.0-0847e449';
const CACHE = 'cel-coord-' + VERSAO;
const FICHEIROS = ["./index.html", "./manifest.webmanifest", "./icons/coord-192.png", "./icons/coord-512.png", "./icons/coord-maskable-512.png"];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS.map((f) => new Request(f, { cache: 'reload' })))));  });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cel-coord-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Uma versão antiga da aplicação dos professores pode abrir-se neste endereço e pedir «Atualizar»: recarrega para mostrar a área da coordenação.
self.addEventListener('message', (e) => {
  if (e.data !== 'ATUALIZAR') return;
  self.skipWaiting();
  const c = e.source;
  if (c && c.type === 'window' && typeof c.navigate === 'function' && !self.registration.waiting && !self.registration.installing) c.navigate(c.url).catch(() => {});
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/acessos.json')) return;            // a lista publicada vem sempre da internet
  if (url.pathname.includes('/formacoes/')) return;              // as formações publicadas também
  if (req.mode === 'navigate') { e.respondWith(caches.match('./index.html', { cacheName: CACHE }).then((r) => r || fetch(req))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true, cacheName: CACHE }).then((r) => r || fetch(req)));
});
