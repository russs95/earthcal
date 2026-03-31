# EarthCal — Efficiency & Security Improvements
*Last updated: 2026-03-29*

Opportunities grouped by theme. Each entry notes the affected file(s), the current cost/risk, and the recommended change.

---

## Security

### SEC-001: No CSRF protection on any PHP API endpoint
**Files:** All `api/v1/*.php` endpoints
**Risk:** Medium
**Description:** Every state-changing endpoint (`add_item.php`, `update_item.php`, `delete_item.php`, `delete_cal.php`, `add_new_cal.php`, etc.) accepts POST requests that rely solely on session cookies for authentication. No CSRF token is checked. CORS validation and `Content-Type: application/json` provide partial mitigation, but a CSRF token is the correct defence.
**Recommendation:** Generate a per-session CSRF token server-side (store in `$_SESSION['csrf_token']`), return it in the initial page load or via a dedicated endpoint, and verify it in every POST handler:
```php
if (!hash_equals($_SESSION['csrf_token'], $data['csrf_token'] ?? '')) {
    http_response_code(403);
    exit(json_encode(['error' => 'Invalid CSRF token']));
}
```
On the JS side, include `csrf_token` in every `fetch` body.

### SEC-002: User-controlled content rendered via `innerHTML`
**Files:** `js/item-management.js`, `js/1-event-management.js`, `js/calendar-scripts.js`, `js/time-setting.js`, `js/login-scripts.js`
**Risk:** Medium (stored XSS if server validation is ever weakened)
**Description:** Item titles, descriptions, calendar names, and user-provided strings are interpolated directly into `innerHTML` template literals in many places. If input sanitization on the PHP side is bypassed or misconfigured, a malicious calendar title such as `<img src=x onerror=fetch(...)>` would execute in every visitor's browser.
**Recommendation:**
- For simple text fields (title, name), use `element.textContent = value` instead of innerHTML.
- Where HTML structure is needed, build the DOM with `createElement` / `appendChild`.
- As a belt-and-suspenders measure, add a lightweight client-side escape helper and apply it to all user-supplied strings before HTML insertion:
```js
function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

### SEC-003: JWT / auth state is only verified client-side
**File:** `js/login-scripts.js` — `isLoggedIn()`, `isExpired()`
**Risk:** Medium
**Description:** `isLoggedIn()` trusts data stored in `localStorage` and `sessionStorage`, checks expiry client-side, but does not verify the JWT signature client-side (which is intentional — signature verification belongs on the server). The risk is that any PHP endpoint must re-validate the token on every request. If any endpoint skips this (e.g. `get_earthcal_plans.php` which is used as a connectivity probe), it may expose data to unauthenticated callers.
**Recommendation:** Audit every PHP endpoint: confirm each one that returns user-specific data validates the Bearer token or session before responding. Document the authentication expectation at the top of each file.

### SEC-004: Stripe webhook lacks idempotency guard
**File:** `api/v1/stripe_webhook.php`
**Risk:** Medium (billing)
**Description:** Stripe can deliver the same webhook event more than once. Without tracking processed event IDs, plan upgrades or subscription changes could be applied multiple times (e.g., double-crediting a user, or repeatedly sending a welcome email).
**Recommendation:** After verifying the Stripe signature, check whether `$event->id` has already been processed (store processed IDs in a `stripe_events` table with a unique index). Skip processing and return `200` if already seen.

### SEC-005: Sensitive Buwana app ID hardcoded in multiple JS files
**Files:** `js/core.js` line 368; `js/1-event-management.js`; `js/item-management.js`
**Risk:** Low
**Description:** `ecal_7f3da821d0a54f8a9b58` appears in several files as a hardcoded constant. While this is a public integration identifier rather than a secret key, having it spread across files makes rotation painful.
**Recommendation:** Centralise it in `js/earthcal-config.js` as a single exported constant and import it elsewhere.

---

## Performance

### PERF-001: 365+ event listeners per year change (replace with delegation)
**File:** `js/calendar-scripts.js` — `addDayPathEventListeners()` (lines 451–472)
**Impact:** High — affects every user every time they navigate years
**Description:** The function attaches 4 event handlers to each of 365 day paths individually. This means ~1,460 listener registrations per year change. Event delegation — a single listener on the parent SVG element — achieves the same effect with 1 registration:
```js
document.getElementById('EarthCycles').addEventListener('mouseover', e => {
    const path = e.target.closest('path[id$="-day"]');
    if (path) handleDayPathMouseOver({ target: path });
});
```
This also eliminates the memory-leak bug (BUG-003).

### PERF-002: `querySelectorAll` called repeatedly in `addMoonPhaseInteraction()`
**File:** `js/calendar-scripts.js` lines 379–382
**Impact:** Medium
**Description:** `document.querySelectorAll('path[id$="-day"]')` scans the entire 1.5 MB SVG DOM on every call. The result should be cached after the SVG is first loaded and invalidated only when `updateDayIds` rewrites the IDs.
```js
let _dayPathsCache = null;
function getDayPaths() {
    if (!_dayPathsCache) _dayPathsCache = [...document.querySelectorAll('path[id$="-day"]:not([id*="lunar"])')];
    return _dayPathsCache;
}
// Reset cache after updateDayIds()
function updateDayIds(year) { _dayPathsCache = null; /* ...existing logic... */ }
```

### PERF-003: `updateDayIds()` triggers 730+ synchronous DOM writes
**File:** `js/calendar-scripts.js` — `updateDayIds(year)` (lines 62–80)
**Impact:** Medium — noticeable jank on year navigation
**Description:** The function iterates all day and day-marker paths (730+ elements) and calls `setAttribute('id', ...)` on each one synchronously. Each attribute write can trigger style recalculation.
**Recommendation:** Wrap the loop body in `requestAnimationFrame` and batch writes, or use `DocumentFragment` / `replaceChildren` where possible. At minimum, avoid forced reflows inside the loop.

### PERF-004: Regex compiled on every animation frame
**File:** `js/planet-orbits.js` — `parseRotateDegrees()`
**Impact:** Low-medium (cosmetic — affects 60 fps animation smoothness)
**Description:** See BUG-010. The fix is trivial — hoist the compiled regex to module scope. At 60 fps × 8 planets this saves ~480 object allocations per second.

### PERF-005: `innerHTML +=` in loops forces repeated DOM re-parse
**File:** `js/kin-cycles.js` lines 247, 291, 1735; `js/1-event-management.js` line 1438
**Impact:** Low (small loops, but the pattern is a known antipattern)
**Description:** See BUG-006. Build a string or array first, assign innerHTML once.

### PERF-006: Service worker pre-cache list may include stale or large assets
**File:** `js/service-worker.js` — `PRECACHE_URLS` array
**Impact:** Low-medium (install time, quota)
**Description:** The SVG (`cals/earthcal-v1-2-2.svg` at 1.5 MB) and `js/astronomy.browser.js` (422 KB) are pre-cached on every service worker install. If the service worker version bumps frequently, users re-download these large static assets unnecessarily.
**Recommendation:** Split the cache into two named caches: `earthcal-static-v1` (large assets that rarely change) and `earthcal-shell-vX` (HTML/JS/CSS that changes with releases). Only bump the shell cache version on deploy; the static cache persists across deploys.

### PERF-007: Connectivity probe fires on every `determineConnectivity()` call within 18 s window — but login-scripts.js bypasses syncStore
**File:** `js/login-scripts.js` lines 373, 396, 430, 773, 779, 833, 1153, 2241, 2361, 2752, 2886, 2963
**Impact:** Medium — unnecessary network requests
**Description:** `sync-store.js` caches the connectivity result for 18 seconds and provides `syncStore.getStatus()`. However, `login-scripts.js` repeatedly reads `navigator.onLine` directly, bypassing this cache. Each bypass can trigger UI state changes based on stale data, and in some paths triggers its own network fetch.
**Recommendation:** Replace all `navigator.onLine` reads in `login-scripts.js` with `(window.syncStore?.getStatus()?.backendReachable ?? navigator.onLine)`.

---

## Code Quality & Maintainability

### CODE-001: Inconsistent error handling — some async paths silently swallow errors
**Files:** `js/sync-store.js`, `js/earthcal-init.js`, `js/calendar-scripts.js`
**Description:** Some try-catch blocks have `// ignore` or empty catch bodies. Silent failures make bugs invisible in production. At minimum, every catch should `console.warn` the error and file context, even if it then continues gracefully.
**Recommendation:** Adopt a project-wide helper:
```js
function logError(context, err) {
    console.warn(`[EarthCal:${context}]`, err?.message ?? err);
}
```

### CODE-002: Dead and commented-out code throughout calendar-scripts.js and kin-cycles.js
**Files:** `js/calendar-scripts.js` lines 208–209, 468, 470; `js/kin-cycles.js` line 248
**Description:** Commented-out code (`// path.addEventListener('touchstart', ...)`, `// displayDayInfo(date)`, `// whaleInfoDiv.innerHTML += ...`) obscures intent and creates maintenance uncertainty. If code is intentionally disabled, document why; if it is obsolete, delete it.

### CODE-003: Magic numbers with no named constants
**Files:** `js/planet-orbits.js`, `js/kin-cycles.js`, `js/calendar-scripts.js`
**Description:** Numbers like `500`, `1000`, `1500`, `2000`, `3000` (animation durations), `88`, `224.7`, `365.256` (orbital periods), `18` (connectivity cache seconds) appear inline without names. Orbital period values are documented in CLAUDE.md, but the code doesn't reference that documentation.
**Recommendation:** Define named constants at the top of each file:
```js
// planet-orbits.js
const ORBITAL_PERIODS = { mercury: 88, venus: 224.7, earth: 365.256, /* ... */ };
const ANIM_MS = { fast: 500, medium: 1000, slow: 3000 };
```

### CODE-004: Buwana app ID scattered across multiple files
**Files:** `js/core.js`, `js/1-event-management.js`, `js/item-management.js`
**Description:** The string `ecal_7f3da821d0a54f8a9b58` and the Buwana base URL appear in several files. Rotating this value requires a grep-and-replace across the codebase.
**Recommendation:** Move to `js/earthcal-config.js` as a single exported constant.

### CODE-005: PHP API files duplicate CORS and DB connection logic
**Files:** All `api/v1/*.php`
**Description:** Every PHP file repeats the same CORS origin-check block (~20 lines) and the same PDO connection setup. Any change to allowed origins or DB credentials must be applied to every file individually.
**Recommendation:** Extract into shared include files:
```php
// api/v1/_cors.php  — CORS headers + origin check
// api/v1/_db.php    — PDO connection factory
```
Then each endpoint becomes `require '_cors.php'; require '_db.php';`.

### CODE-006: Service worker cache version is not linked to the app version
**File:** `js/service-worker.js`
**Description:** The cache name `earthcal-cache-v3` is a static string. When `earthcal-init.js` bumps its own `?v=` number, the service worker cache name is not automatically updated, so stale cached scripts can survive a deploy.
**Recommendation:** Inject the version at build time (even if the "build" is just a sed substitution in a deploy script), or derive the cache name from the highest `?v=` value in the precache list. Document in CLAUDE.md that bumping the service worker's cache version is part of the release checklist.

### CODE-007: `loadScript()` in earthcal-init.js has no retry logic for transient failures
**File:** `js/earthcal-init.js`
**Description:** On a slow or flaky connection, a single HTTP timeout during script loading causes silent init failure (see BUG-009). A one-retry policy would cover the majority of transient cases with minimal complexity:
```js
async function loadScript(src, isModule = false, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try { await _loadScriptOnce(src, isModule); return; }
        catch (e) { if (attempt === retries) throw e; }
    }
}
```
