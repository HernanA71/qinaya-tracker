/**
 * QINAYA TRACKER - Service Worker
 * Cache de assets para funcionamiento offline básico
 */

const CACHE_NAME = 'qinaya-tracker-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/tokens.css',
    '/styles/components.css',
    '/styles/dashboard.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/charts.js',
    '/js/admin.js',
    '/js/technician.js',
    '/js/app.js'
];

// Install - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests (Google Apps Script)
    if (event.request.url.includes('script.google.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone response to cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request)
                    .then(response => response || new Response('Offline', { status: 503 }));
            })
    );
});

// Background sync for offline installations
self.addEventListener('sync', event => {
    if (event.tag === 'sync-installations') {
        event.waitUntil(syncInstallations());
    }
});

async function syncInstallations() {
    const queue = await getOfflineQueue();

    for (const item of queue) {
        try {
            await fetch(item.url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(item.data)
            });
            await removeFromQueue(item.id);
        } catch (error) {
            console.error('Sync failed for item:', item.id);
        }
    }
}

async function getOfflineQueue() {
    // This would read from IndexedDB in production
    return [];
}

async function removeFromQueue(id) {
    // This would remove from IndexedDB in production
}
