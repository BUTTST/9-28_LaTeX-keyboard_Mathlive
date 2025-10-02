const CACHE_NAME = 'discrete-math-keyboard-v8';
const urlsToCache = [
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache addAll failed:', error);
        // 即使快取失敗也繼續安裝
        return Promise.resolve();
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 僅處理 http/https 請求，避免 chrome-extension 等 scheme 造成錯誤
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // 讓瀏覽器自行處理
  }

  event.respondWith(
    caches.match(req)
      .then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          // 僅快取 200 的基本類型回應
          if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
            return networkRes;
          }
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(() => {});
          return networkRes;
        });
      })
      .catch(() => {
        if (req.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// 清理舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

