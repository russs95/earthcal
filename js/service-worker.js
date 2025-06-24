const CACHE_NAME = 'earthcal-cache-v2';
const MAX_API_CACHE_ITEMS = 5; // Maximum number of cached API responses

// List of assets to pre-cache
const STATIC_ASSETS = [
    './index.html',
    './fonts/Mulish-Light.ttf',
    './fonts/Mulish-Medium.ttf',
    './fonts/Arvo-Regular.ttf',
    './cycles/whale-cycle.json',
    './svgs/search-day.svg',
    './svgs/search-day-over.svg',
    './svgs/settings-icon.svg',
    './subscription-side-image.svg',
    './webp/earthen-logo-icon.webp',
    './webp/earthen-subscription-background-dark.webp',
    './webp/earthen-subscription-background-light.webp'
];

// 🔹 Install event - Cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// 🔹 Activate event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log(`[Service Worker] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// 🔹 Helper function to limit API cache size
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        console.log(`[Service Worker] Cache limit reached. Deleting oldest entry.`);
        await cache.delete(keys[0]); // Delete the oldest cache entry
    }
}

// 🔹 Fetch event - Serve from cache or fetch from network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                if (response) {
                    console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
                    return response;
                }

                console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
                return fetch(event.request).then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse; // Only cache valid responses
                    }

                    // Cache API responses but replace old data
                    if (event.request.url.includes('/api/datecycles')) {
                        console.log(`[Service Worker] Caching new API response: ${event.request.url}`);
                        cache.put(event.request, networkResponse.clone()); // Overwrite cache
                        limitCacheSize(CACHE_NAME, MAX_API_CACHE_ITEMS); // Enforce cache size
                    }

                    return networkResponse;
                });
            });
        })
    );
});
