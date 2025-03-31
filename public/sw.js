const CACHE_VERSION = 'v1';
const CACHE_NAME = `kanban-board-${CACHE_VERSION}`;

// URLs to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url))
        ).then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`Failed to cache ${urlsToCache[index]}:`, result.reason);
            }
          });
        });
      })
  );
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('kanban-board-') && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip caching for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for browser-sync requests
  if (event.request.url.includes('browser-sync')) {
    return;
  }

  // Skip caching for Firebase Storage URLs
  if (event.request.url.includes('firebasestorage.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, return a fallback response
            return new Response('Offline content not available');
          });
      })
  );
}); 