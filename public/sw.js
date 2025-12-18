// Service Worker for Open Ham Prep PWA
// Provides offline caching and faster load times

const CACHE_NAME = 'ham-prep-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch event - network-first strategy with cache fallback
// This ensures users get fresh content when online, but can still use the app offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests (Supabase) - these should not be cached
  if (event.request.url.includes('/rest/') ||
      event.request.url.includes('/auth/') ||
      event.request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching (response can only be consumed once)
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If request is for a page, return the cached index for SPA routing
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          // No cache available
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
