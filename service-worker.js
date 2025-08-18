const CACHE_NAME = 'wallet-wise-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-16x16.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap'
];

// Install event: cache all necessary assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Caching failed:', error);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
    // Only handle HTTP/HTTPS requests, ignore chrome-extension:// etc.
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Exclude Google Apps Script URL from caching, always go to network
    if (event.request.url.includes('script.google.com/macros/s/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }
                // No cache hit - fetch from network
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Put a copy of the response in the cache
                        return caches.open(CACHE_NAME).then(cache => {
                            // Do not cache opaque responses (e.g., cross-origin no-cors)
                            if (networkResponse.ok || networkResponse.type === 'opaque') {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(() => {
                        // If both cache and network fail, check for specific offline fallbacks
                        if (event.request.mode === 'navigate') { // For navigation requests
                            // You could serve an offline page here
                            // return caches.match('/offline.html');
                        }
                        // Otherwise, simply throw the error
                        throw new Error('Network request failed and no cache found.');
                    });
            })
    );
});
