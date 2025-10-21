const CACHE_NAME = 'osaifu-nikki-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './images/icon-192x192.png',
  './images/icon-512x512.png',
  // 他に必要なアセット（calendar.html, graph.htmlなど）もここに追加
  './calendar.html',
  './graph.html',
  './category_manager.html',
  './pachinko_index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});