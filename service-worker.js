self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('earthcal-cache').then(cache => {
      return cache.addAll([


//FONTS 

'/fonts/Mulish-Light.ttf',
'/fonts/Mulish-Medium.ttf',
'/fonts/Arvo-Regular.ttf',


//Landing Images



        '/cycles/whale-cycle.json',
        '/index.html',
        '/cycles/whale-cycle.json',
        'svgs/search-day.svg',
        'svgs/search-day-over.svg',
        'svgs/settings-icon.svg',
        'svgs/settings-icon-over.svg',
        'svgs/about-i-day.svg',
        'svgs/about-i-day.svg',
        'svgs/cycles-day.svg',
        'svgs/cycles-day-over.svg',
        'svgs/cycles-day.svg',
        'svgs/cycles-day-over.svg',
        'svgs/moon-day.svg',
        'svgs/moon-day-over.svg',
        'svgs/earth-day.svg',
        'svgs/earth-day-over.svg',
        'svgs/menu-day.svg',
        'svgs/menu-day-over.svg',
        'svgs/login-icon.svg',
        'svgs/login-icon-over.svg',
        'svgs/search-night.svg',
        'svgs/search-night-over.svg',
        'svgs/about-i-night.svg',
        'svgs/about-i-night-over.svg',
        'svgs/down-arrow-night.svg',
        'svgs/up-arrow-night.svg',
        'svgs/menu-night.svg',
        'svgs/menu-night-over.svg',
        'svgs/cycles-night.svg',
        'svgs/cycles-night-over.svg',
        'svgs/moon-night.svg',
        'svgs/moon-night-over.svg',
        'svgs/earth-night.svg',
        'svgs/earth-night-over.svg',
        'svgs/login-icon-night.svg?v=3',
        'svgs/login-icon-night-over.svg',
        'svgs/earthcycles-logo-motto-o-day.svg',
        'svgs/earthcycles-logo-motto-o.svg',

        'svgs/earthcal-banner.svg',
        
        //Registration images 
        'subscription-side-image.svg',
        'webp/earthen-logo-icon.webp',
        'webp/earthen-subscription-background-dark.webp',
        'webp/earthen-subscription-background-light.webp',


      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // If the requested URL is in the cache, return the cached response
      if (response) {
        return response;
      }

      // If the requested URL is not in the cache, fetch it from the network
      return fetch(event.request).then(response => {
        // Clone the response to cache it and then return the response
        const clonedResponse = response.clone();
        caches.open('my-cache').then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      });
    })
  );
});
