self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('earthcal-cache').then(cache => {
      return cache.addAll([
        // Fonts
        './fonts/Mulish-Light.ttf',
        './fonts/Mulish-Medium.ttf',
        './fonts/Arvo-Regular.ttf',

        // Landing Images
        './cycles/whale-cycle.json',
        './index.html',
        './svgs/search-day.svg',
        './svgs/search-day-over.svg',
        './svgs/settings-icon.svg',
        // Additional assets with relative paths
        // ...

        // Registration images
        './subscription-side-image.svg',
        './webp/earthen-logo-icon.webp',
        './webp/earthen-subscription-background-dark.webp',
        './webp/earthen-subscription-background-light.webp'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Fetch from network and cache it
      return fetch(event.request).then(networkResponse => {
        // Clone and cache the network response
        const clonedResponse = networkResponse.clone();
        caches.open('earthcal-cache').then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      });
    })
  );
});
