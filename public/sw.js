// Service Worker — Restaurant OS Web Push
// Plain JS (no TypeScript). Handles push events, notification clicks, and basic fetch caching.

self.addEventListener('push', event => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: payload.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

const CACHE_NAME = 'restaurant-os-offline-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Pour les requêtes de navigation de page, tentative réseau avec fallback vers la page /offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached || new Response('Mode hors-ligne Restaurant OS', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      })
    );
    return;
  }

  // Pour les autres assets statiques, cache puis réseau
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => undefined))
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'restaurant-os-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'PROCESS_SYNC_QUEUE' }));
      })
    );
  }
});
