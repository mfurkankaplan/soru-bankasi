// Soru Bankası - service worker
// Uygulama dosyalarını önbelleğe alır, internetsiz çalışmayı sağlar.
// Yeni sürüm yayınlarken SURUM değerini artırın.
const SURUM = 'sb-v1';
const TEMEL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './lib/pdfjs/pdf.min.mjs',
  './lib/pdfjs/pdf.worker.min.mjs'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(TEMEL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SURUM).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const sayfa = req.mode === 'navigate' || req.url.endsWith('/index.html');
  if (sayfa) {
    // Sayfa: önce ağ (güncelleme gelsin), yoksa önbellek
    e.respondWith(
      fetch(req).then(res => {
        const kopya = res.clone();
        caches.open(SURUM).then(c => c.put(req, kopya));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // Diğer dosyalar: önce önbellek, yoksa ağdan alıp önbelleğe koy
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok) { const kopya = res.clone(); caches.open(SURUM).then(c => c.put(req, kopya)); }
      return res;
    }))
  );
});
