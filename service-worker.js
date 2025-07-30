// service-worker.js

const CACHE_NAME = 'con-v-v1';
const urlsToCache = [
  'index.html',
  'styles/main.css',
  'scripts/main.js',
  'scripts/translations.json',
  'favicon/apple-touch-icon.png',
  'favicon/favicon-96x96.png',
  'favicon/favicon.ico',
  'favicon/favicon.svg',
  'favicon/web-app-manifest-192x192.png',
  'favicon/web-app-manifest-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
