importScripts('earthcal-config.js');

const cachingEnabled = self.EARTHCAL_BETA_TESTING?.enabled !== true;
const CACHE_NAME = 'earthcal-cache-v3';
const MAX_API_CACHE_ITEMS = 8; // Maximum number of cached API responses

// List of assets to pre-cache
const STATIC_ASSETS = [
    './index.html',
    './dash.html',
    './robots.txt',
    './site.webmanifest',
    './assets/icons/favicon.ico',
    './js/earthcal-config.js',
    './js/earthcal-init.js?v=38.1',
    './js/suncalc.min.js',
    './js/astronomy.browser.js',
    './js/core-javascripts.js?v=23.3',
    './js/1-gcal-javascripts.js?v=3.2',
    './js/breakouts.js',
    './js/set-targetdate.js',
    './js/planet-orbits.js',
    './js/login-scripts.js?v=18',
    './js/item-management.js?v=9.7',
    './js/time-setting.js?v=1.3',
    './js/calendar-scripts.js?v=2.5',
    './css/light.css?v=7.61',
    './css/dark.css?v=7.7',
    './css/1-stylesheet.css?v=12.7',
    './css/login-styles.css?v=8.72',
    './css/slider.css?v=1.2',
    './css/mini-mode.css?v=1',
    './assets/fonts/Mulish-Light.ttf',
    './assets/fonts/Mulish-Medium.ttf',
    './assets/fonts/Arvo-Regular.ttf',
    './cycles/whale-cycle.json',
    './cals/earthcal-v1-0-3.svg?v=8',
    './svgs/earthen-icon.svg',
    './svgs/search-day.svg',
    './svgs/search-day-over.svg',
    './svgs/settings-icon.svg',
    './svgs/up-reg-arrow-dark.svg',
    './svgs/up-reg-arrow-dark-over.svg',
    './svgs/up-reg-arrow-dark-active.svg',
    './svgs/up-reg-arrow-dark-active-hover.svg',
    './svgs/up-reg-arrow-light.svg',
    './svgs/up-reg-arrow-light-over.svg',
    './svgs/up-reg-arrow-light-active.svg',
    './svgs/up-reg-arrow-light-active-hover.svg',
    './subscription-side-image.svg',
    './webp/earthen-logo-icon.webp',
    './webp/earthen-subscription-background-dark.webp',
    './webp/earthen-subscription-background-light.webp'
];

const NAVIGATION_FALLBACK = './dash.html';
const API_ENDPOINTS = [
    '/api/datecycles',
    '/api/v1/list_calendars.php',
    '/api/v1/get_cal_info.php',
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
    if (!cachingEnabled) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event.request));
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                if (response) {
                    console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
                    return response;
                }

                console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
                return fetch(event.request)
                    .then(networkResponse => handleNetworkResponse(event.request, networkResponse, cache))
                    .catch(() => handleOfflineFallback(event.request, cache));
            });
        })
    );
});

async function handleNavigationRequest(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (err) {
        const fallback = (await cache.match(NAVIGATION_FALLBACK)) || (await cache.match(request));

        if (fallback) {
            console.warn('[Service Worker] Serving navigation fallback while offline.');
            return fallback;
        }

        return new Response('<h1>Offline</h1><p>The app is unavailable right now.</p>', {
            headers: { 'Content-Type': 'text/html' },
            status: 503,
        });
    }
}

function shouldCacheApiRequest(url) {
    return API_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function isCacheableResponse(request, response) {
    if (request.method !== 'GET') {
        return false;
    }

    if (!response || response.status !== 200) {
        return false;
    }

    return response.type === 'basic' || response.type === 'cors';
}

function handleNetworkResponse(request, networkResponse, cache) {
    if (isCacheableResponse(request, networkResponse) && shouldCacheApiRequest(request.url)) {
        console.log(`[Service Worker] Caching API response: ${request.url}`);
        cache.put(request, networkResponse.clone());
        limitCacheSize(CACHE_NAME, MAX_API_CACHE_ITEMS);
    }

    return networkResponse;
}

async function handleOfflineFallback(request, cache) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    if (request.destination === 'document') {
        const fallback = await cache.match(NAVIGATION_FALLBACK);
        if (fallback) {
            console.warn('[Service Worker] Returning navigation fallback after fetch failure.');
            return fallback;
        }
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' });
}
