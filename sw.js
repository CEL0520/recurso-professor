/* Recursos do Professor CEL — guarda a aplicação no telemóvel para funcionar sem internet. */
const VERSAO = '1.0.0-173e0cf8';
const CACHE = 'cel-rp-' + VERSAO;
const FICHEIROS = ["./", "./index.html", "./manifest.webmanifest", "./dados.1ee3d4d0c9.bin", "./fonts/Lora-Bold.woff", "./fonts/Figtree.woff", "./fonts/IBMPlexMono-Regular.woff", "./fonts/IBMPlexMono-Medium.woff", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/emblema.jpg"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cel-rp-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'ATUALIZAR') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/acessos.json')) return;            // a lista de acessos vem sempre da internet
  if (req.mode === 'navigate') { e.respondWith(caches.match('./index.html', { cacheName: CACHE }).then((r) => r || fetch(req))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true, cacheName: CACHE }).then((r) => r || fetch(req)));
});
