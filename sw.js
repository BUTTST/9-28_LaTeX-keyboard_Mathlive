const CACHE_NAME = 'discrete-math-keyboard-v7';
const urlsToCache = [
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/mathlive/dist/mathlive.min.js'
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
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到，返回快取版本
        if (response) {
          return response;
        }
        
        // 否則從網路獲取
        return fetch(event.request).then(response => {
          // 檢查是否收到有效的回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 複製回應
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 網路和快取都失敗時的後備處理
        if (event.request.destination === 'document') {
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

