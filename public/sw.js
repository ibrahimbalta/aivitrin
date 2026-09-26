// AiKlavuz Advanced Service Worker v10 (PWA & APK Optimized)
const CACHE_NAME = 'aiklavuz-cache-v10';
const OFFLINE_URL = '/offline.html';

const APP_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/css/style.css',
  '/css/toolkit.css',
  '/js/i18n.js',
  '/js/app.js',
  '/js/toolkit.js',
  '/js/pwa-register.js',
  '/icons/icon-192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
  '/studio',
  '/models',
  '/prompt-studio',
  '/stack',
  '/kariyer',
  '/workflows',
  '/calculator',
  '/offline.html'
];

// Install: Pre-cache App Shell & Offline Page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching App Shell & Offline Assets');
      return cache.addAll(APP_SHELL_ASSETS).catch(err => {
        console.warn('[Service Worker] Non-fatal caching issue on install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Remove outdated cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Purging old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate with Offline HTML Fallback
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle same-origin GET requests
  if (
    request.method !== 'GET' ||
    !request.url.startsWith(self.location.origin) ||
    request.url.includes('/api/') ||
    request.url.includes('/auth/') ||
    request.url.includes('/admin')
  ) {
    return;
  }

  // For HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Try to serve from cache first
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to offline page
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;
          return new Response('Çevrimdışısınız. Lütfen internet bağlantınızı kontrol edin.', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // For static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          if (networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
