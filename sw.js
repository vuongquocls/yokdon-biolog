const CACHE_NAME = 'yokdon-biolog-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './catalog.json',
  './icon.svg',
  './layer_vqg_ranh.geojson',
  './layer_vqg_bo.geojson',
  './layer_tram.geojson',
  './layer_pkcn_bvnn.geojson',
  './layer_pkcn_phst.geojson',
  './layer_pkcn_dvhc.geojson',
  './layer_tieukhu.geojson',
  './layer_tieukhu_diem.geojson',
  './layer_dtk.geojson',
  './layer_song_srp.geojson',
  './layer_ql14c.geojson',
  './layer_giaothong.geojson',
  './layer_biengioi_cpc.geojson',
  './layer_hanhchinh.geojson',
  './layer_hctext.geojson',
  './layer_cql.geojson'
];

// Leaflet CDN assets — cache on first use (runtime caching)
const CDN_PATTERNS = [
  'unpkg.com/leaflet',
  'tile.openstreetmap.org',
  'server.arcgisonline.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache-first for local assets (GeoJSON layers, HTML, JSON, Icons)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Network-first + cache for CDN (Leaflet, map tiles)
  const isCDN = CDN_PATTERNS.some(p => url.href.includes(p));
  if (isCDN) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
