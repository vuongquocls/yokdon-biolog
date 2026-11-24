const CACHE_NAME = 'yokdon-biolog-v9';

// Tài nguyên lõi cần thiết để ứng dụng hoạt động ngoại tuyến ngay lập tức
const CORE_ASSETS = [
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
  './layer_ql14c.geojson',
  './layer_biengioi_cpc.geojson',
  './layer_hanhchinh.geojson',
  './layer_hctext.geojson',
  './layer_cql.geojson'
];

// Các lớp GeoJSON dung lượng lớn (~4.5MB), tách tải nền lazy để tránh rớt gói khi mạng yếu
const LAZY_ASSETS = [
  './layer_dtk.geojson',
  './layer_song_srp.geojson'
];

// CDN thư viện & bản đồ nền — cache khi sử dụng (runtime caching)
const CDN_PATTERNS = [
  'unpkg.com/leaflet',
  'tile.openstreetmap.org',
  'server.arcgisonline.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Dùng Promise.allSettled để không bị ngắt toàn bộ quá trình install nếu sóng yếu rớt 1 file
      await Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW Install] Không tải trước được:', url, err);
          })
        )
      );

      // Tải nền lazy cho các lớp nặng, không block sự kiện install
      Promise.allSettled(
        LAZY_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.log('[SW Install] Tài nguyên nặng sẽ được nạp khi kích hoạt hoặc online:', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
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

  // Cache-first cho tài nguyên nội bộ (HTML, CSS/JS nội bộ, GeoJSON, icon, catalog)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (!res || res.status !== 200 || res.type !== 'basic') {
            return res;
          }
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Network-first + cache cho CDN (Leaflet, tile map)
  const isCDN = CDN_PATTERNS.some(p => url.href.includes(p));
  if (isCDN) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
