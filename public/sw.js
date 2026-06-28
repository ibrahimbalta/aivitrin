const CACHE_NAME = 'aiklavuz-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/css/style.css',
  '/js/i18n.js',
  '/js/app.js',
  '/js/toolkit.js',
  '/js/advisor.js',
  '/js/ads.js',
  '/manifest.json',
  '/icons/icon-512.png',
  '/icons/icon.svg'
];

// Install Event - Pre-caches App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleans up old cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate caching strategy
self.addEventListener('fetch', event => {
  // Only handle same-origin GET requests
  // Exclude administrative panels, login, session auth, and data APIs
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.url.includes('/admin') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cache instantly, and fetch fresh content in background to update cache
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {
            // Quietly absorb offline errors during background sync
          });
        return cachedResponse;
      }

      // If not in cache, request from network
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache newly discovered resources dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
