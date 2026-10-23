/* Recursos do Professor CEL — guarda a aplicação no telemóvel para funcionar sem internet. */
const VERSAO = '1.1.0-17c01b6e';
const CACHE = 'cel-rp-' + VERSAO;
const FICHEIROS = ["./", "./index.html", "./manifest.webmanifest", "./dados.2460e27fab.bin", "./fonts/Lora-Bold.woff", "./fonts/Figtree.woff", "./fonts/IBMPlexMono-Regular.woff", "./fonts/IBMPlexMono-Medium.woff", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/emblema.jpg"];
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
    // sempre da internet, sem a cache do navegador: uma página antiga com manuais novos (ou o contrário) não abria
    await c.addAll(falta.map((f) => new Request(f, { cache: 'reload' })));
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cel-rp-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data === 'ATUALIZAR') self.skipWaiting();
  if (e.data === 'CEL-AVISAR') e.waitUntil(avisar());
});

/* Avisos do calendário: a aplicação guarda as atividades neste telemóvel; quando o telemóvel acorda a aplicação
   (de tempos a tempos, com internet), avisa na véspera e no próprio dia de cada atividade. */
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open('cel-avisos', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function kv(k, v) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', v === undefined ? 'readonly' : 'readwrite'), st = tx.objectStore('kv');
    const q = v === undefined ? st.get(k) : st.put(v, k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
const diaLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
async function avisar() {
  const cfg = await kv('cfg');
  if (!cfg || !cfg.ativos || self.Notification === undefined || Notification.permission !== 'granted') return;
  const ev = (await kv('eventos')) || [], feitos = (await kv('feitos')) || {};
  const agora = new Date(), hoje = diaLocal(agora), amanha = diaLocal(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1));
  for (const e of ev) {
    if ((e.g === 'financeiro' && !cfg.fin) || (e.g === 'alusiva' && !cfg.alu)) continue;
    for (const d of e.d) {
      const q = d === hoje ? 'Hoje' : d === amanha ? 'Amanhã' : null;
      if (!q) continue;
      const k = `${e.id}|${d}|${q}`;
      if (feitos[k]) continue;
      await self.registration.showNotification(`${q}: ${e.t}`, { body: [e.cat, e.h].filter(Boolean).join(' · '), tag: k, icon: './icons/icon-192.png', data: { url: './#calendario' } });
      feitos[k] = Date.now();
    }
  }
  for (const k of Object.keys(feitos)) if (Date.now() - feitos[k] > 60 * 864e5) delete feitos[k];
  await kv('feitos', feitos);
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'cel-avisos') e.waitUntil(avisar()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const url = new URL((e.notification.data && e.notification.data.url) || './', self.location).href;
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) {
      const p = new URL(c.url).pathname;
      if ((p === BASE || p === BASE + 'index.html') && 'focus' in c) { try { await c.navigate(url); } catch (x) { /* nada */ } return c.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});
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
