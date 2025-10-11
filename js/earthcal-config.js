// Shared toggle for Earthcal caching behaviour.
// Flip `enabled` to `false` (or comment out this assignment) to disable caching across the app and service worker.
const EARTHCAL_CACHE_CONFIG = { enabled: true };

if (typeof window !== "undefined") {
    window.EARTHCAL_CACHE_CONFIG = EARTHCAL_CACHE_CONFIG;
}

if (typeof self !== "undefined") {
    self.EARTHCAL_CACHE_CONFIG = EARTHCAL_CACHE_CONFIG;
}
