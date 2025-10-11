// Shared Earthcal caching configuration.
// Toggle EARTHCAL_BETA_TESTING.enabled to control whether offline caching runs.
const EARTHCAL_BETA_TESTING = { enabled: true };

if (typeof window !== "undefined") {
    window.EARTHCAL_BETA_TESTING = EARTHCAL_BETA_TESTING;
}

if (typeof self !== "undefined") {
    self.EARTHCAL_BETA_TESTING = EARTHCAL_BETA_TESTING;
}
