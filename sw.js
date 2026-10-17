/* Recursos do Professor CEL — guarda a aplicação no telemóvel para funcionar sem internet. */
const VERSAO = '1.0.1-c859dd68';
const CACHE = 'cel-rp-' + VERSAO;
const FICHEIROS = ["./", "./index.html", "./manifest.webmanifest", "./dados.1ee3d4d0c9.bin", "./fonts/Lora-Bold.woff", "./fonts/Figtree.woff", "./fonts/IBMPlexMono-Regular.woff", "./fonts/IBMPlexMono-Medium.woff", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/emblema.jpg"];
const BASE = new URL('./', self.location).pathname;
const FIXO = /\/(dados\.[0-9a-f]+\.bin|fonts\/[^/]+)$/;   // ficheiros que nunca mudam com o mesmo nome
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    // aproveita o que já está no telemóvel, para não gastar internet a descarregar outra vez
    const c = await caches.open(CACHE), velhos = (await caches.keys()).filter((k) => k.startsWith('cel-rp-') && k !== CACHE), falta = [];
    for (const f of FICHEIROS) {
      let r = null;
      if (FIXO.test(f)) for (const k of velhos) { r = await caches.match(f, { cacheName: k }); if (r) break; }
      if (r) await c.put(f, r); else falta.push(f);
    }
    await c.addAll(falta);
  })());
});
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
  if (req.mode === 'navigate') {
    if (url.pathname !== BASE && url.pathname !== BASE + 'index.html') return;   // outras páginas (por exemplo, a área da coordenação) vêm da internet
    e.respondWith(caches.match('./index.html', { cacheName: CACHE }).then((r) => r || fetch(req))); return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true, cacheName: CACHE }).then((r) => r || fetch(req)));
});
