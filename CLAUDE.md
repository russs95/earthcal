# CLAUDE.md — EarthCal

## Project Purpose

EarthCal is a circular calendar web app that helps users synchronize personal events and to-dos with Earth's natural cycles — lunar phases, planetary orbits, solar cycles, and animal migrations. Inspired by Igorot culture and other cyclocentric traditions. Vision statement: *"Sync your moments with Earthen Cycles."*

- **Live domain:** earthcal.app / calendar.earthen.io
- **Version:** 1.1.3
- **Author:** Russell Maier
- **License:** MIT / Creative Commons CC BY-NC-ND

---

## Technology Stack

- **Frontend:** Vanilla JavaScript (no framework), inline SVG manipulation, GSAP animation
- **Backend:** PHP with PDO, REST API at `/api/v1/`
- **Database:** MySQL (schema in `api/v1/new_db.sql`)
- **Auth:** Buwana OAuth/OIDC (`buwana.ecobricks.org`)
- **Offline:** Service Worker + localStorage outbox pattern (see section below)
- **Billing:** Stripe (checkout sessions, webhooks, customer portal)
- **Desktop:** Electron app support
- **PWA:** `js/service-worker.js` + `site.webmanifest`

---

## Repository Structure

```
earthcal/
├── index.html              # Landing/marketing page (anonymous users)
├── dash.html               # Main app dashboard (authenticated users)
├── login.html              # Auth redirect: checks tokens, routes to dash or callback
├── share.html              # Shared calendar item view
├── billing-success.html    # Stripe payment success endpoint
├── billing-cancel.html     # Stripe payment cancel endpoint
├── cals/
│   └── earthcal-v1-2-2.svg # The 1.5MB circular calendar SVG (injected at runtime)
├── cycles/
│   ├── cariboo-cycle-map.svg
│   ├── goose-cycle-map.svg
│   ├── humming-cycle-map.svg
│   ├── monarch-cycle-map.svg
│   ├── whale-cycle-map.svg
│   ├── whale-cycle.json    # Whale migration data
│   └── 3I-ATLAS.json       # Comet 3I/ATLAS tracking data
├── css/
│   ├── 1-stylesheet.css    # Main app styles (101 KB)
│   ├── dark.css            # Dark theme overrides
│   ├── light.css           # Light theme overrides
│   ├── login-styles.css    # Auth modal styles
│   ├── mini-mode.css       # Compact view styles
│   └── slider.css          # Range input styles
├── js/
│   ├── earthcal-init.js    # Boot orchestrator — ENTRY POINT for dash.html
│   ├── core.js             # Global helpers, API base resolution, initializePage()
│   ├── time-setting.js     # Clock, timezone, zodiac shade, dark mode, preferences
│   ├── planet-orbits.js    # GSAP planet rotation engine (class PlanetGroupRotator)
│   ├── 1-event-management.js  # DateCycle CRUD, SVG path highlighting, sync wiring
│   ├── item-management.js  # To-do/Event/Journal CRUD, modal forms, calendar select
│   ├── login-scripts.js    # Buwana OIDC auth, plan tiers, session management
│   ├── sync-store.js       # Offline-first outbox engine (window.syncStore)
│   ├── calendar-scripts.js # Year/week navigation, day path ID rewriting
│   ├── kin-cycles.js       # Cycle/planet palette toggles, animal cycle overlays
│   ├── 1-lunar-scripts.js  # Lunar month highlighting, Hijri calendar overlay
│   ├── set-targetdate.js   # Target date selection and propagation
│   ├── 1-gcal-javascripts.js  # Google Calendar integration
│   ├── breakouts.js        # Mobile/responsive helpers
│   ├── dark-mode-toggle.mjs.js  # ES module dark/light theme switcher
│   ├── service-worker.js   # PWA caching and offline app shell
│   ├── first-onboarding.js # First-time user onboarding flow
│   ├── billing-success.js  # Stripe billing confirmation
│   ├── index-i18n-loader.js # Translation/i18n loader
│   ├── earthcal-config.js  # Configuration constants
│   ├── astronomy.browser.js # Astronomical calculations library (422 KB)
│   ├── gsap.min.js         # GSAP animation engine
│   ├── MotionPathPlugin.min.js # GSAP orbital path plugin
│   ├── suncalc.min.js      # Sun/moon rise/set calculations
│   └── hijri-js.common.min.js # Hijri calendar conversion
└── api/v1/                 # PHP REST API (31 files)
    ├── add_item.php
    ├── update_item.php
    ├── delete_item.php
    ├── get_user_items.php
    ├── list_calendars.php
    ├── add_new_cal.php
    ├── delete_cal.php
    ├── create_checkout_session.php
    ├── stripe_webhook.php
    ├── new_db.sql           # Full database schema
    └── ...
```

---

## Initialization Sequence (dash.html entry point)

`js/earthcal-init.js` fires on `DOMContentLoaded` and orchestrates everything:

```
1. Show loading spinner
2. fetch cals/earthcal-v1-2-2.svg  →  inject into <div id="the-cal">
   (SVG must exist in DOM before scripts wire listeners)
3. Preload all scripts in parallel (link rel=preload)
4. Load scripts sequentially (order is critical):
     suncalc.min.js          ← sun/moon math
     sync-store.js           ← offline engine (must be early)
     astronomy.browser.js    ← astronomical calculations
     core.js                 ← global helpers + initializePage()
     1-gcal-javascripts.js   ← Google Calendar
     breakouts.js            ← mobile helpers
     set-targetdate.js       ← target date
     time-setting.js         ← clock, timezone, preferences
     planet-orbits.js        ← GSAP planet animator (BEFORE calendar-scripts)
     login-scripts.js        ← auth
     item-management.js      ← item CRUD
     calendar-scripts.js     ← year/week navigation
5. Load dark-mode-toggle.mjs.js as ES module
6. Call initializePage()     ← defined in core.js, starts the UI
```

`planet-orbits.js` must load before `calendar-scripts.js` because `calendarRefresh()` calls `animatePlanets()`.

---

## Authentication & User Model

- **Provider:** Buwana (`buwana.ecobricks.org`), OIDC/OAuth 2.0
- **Plans:** `padwan` (free default), `jedi`, `master` (premium)
- **Global helpers:** `window.isLoggedIn()`, `getCurrentUser()`, `window.user_plan`
- **Token storage:**
  - `sessionStorage.buwana_user` — JSON user payload
  - `localStorage.id_token` / `localStorage.access_token`
  - `localStorage.user_profile`
- **login.html** is a thin redirect: checks the above storage and routes to `auth/callback/` (logged in) or `dash.html` (new user).

---

## Data Model

**Item types:** To-Do, Event, Journal, Record, DateCycle

**Key item fields:** `item_id`, `buwana_id`, `calendar_id`, `title`, `date`, `year`, `month`, `day`, `time`, `time_zone`, `color_hex`, `emoji`, `pinned`, `frequency`, `all_day`, `description`

**Calendars:** Personal (user-created) and public (subscribed). Each has `calendar_id`, `name`, `color`, `emoji`, `tzid`.

**iCal:** Import/export supported via `connect_ical.php`, `sync_ical.php`, `export_user_ics.php`.

---

## User Preferences (localStorage keys)

| Key | Purpose |
|---|---|
| `user_dark_mode` | Theme: dark or light |
| `user_clock` | Show/hide clock |
| `user_animations` | Enable/disable animations |
| `user_zodiac_positions` | Show/hide zodiac ring |
| `user_lunar_calendar` | Show/hide lunar months |
| `user_comet_tracking` | Enable comet 3I/ATLAS |
| `zodiac_shade_setting` | Zodiac opacity (-100 to +100) |
| `user_timezone` | Selected timezone |
| `user_language` | Preferred language |

---

## SVG Path Schema and Interactive Calendar Scripting

The circular calendar is a single 1.5 MB SVG file (`cals/earthcal-v1-2-2.svg`) injected inline into `<div id="the-cal">`. Because it is inline, all SVG elements are live DOM nodes that JavaScript directly reads and mutates.

### Top-Level SVG Group IDs

| SVG ID | Contents |
|---|---|
| `#EarthCycles` | Root SVG element |
| `#solar-system-center` | Container for all planet/orbit groups |
| `#sol` | The central sun circle (provides pivot coordinates for planet rotation) |
| `#zodiacs` | Zodiac ring group (counter-rotates opposite Earth to stay fixed) |
| `#lunar_months-12` | Lunar month ring group (rotated by `rotateLunarMonths()`) |
| `#mercury`, `#venus`, `#earth`, `#mars`, `#jupiter`, `#saturn`, `#uranus`, `#neptune` | Planet groups (each receives `rotate(deg cx cy)` transforms) |
| `#whale-cycler`, `#whale-marker`, `#whale-year-cycle` | Whale migration animation elements |

### Week Paths

The SVG still contains `path[id^="week-"]` elements (the 52-segment week ring), but all JavaScript (`weekPaths`, `getWeekDateRange`, `updateWeekTitles`, `updateTargetWeekColor`) and CSS (hover styles, fade-in animation) code that interacted with them has been removed. The ring exists in the SVG but is inert.

### Day Paths — the Core of Event Highlighting

Each day of the year has **two SVG paths** on the inner ring:

```
{dayOfYear}-{dayOfMonth}-{month}-{year}-day          (clickable day arc)
{dayOfYear}-{dayOfMonth}-{month}-{year}-day-marker   (small marker dot, receives event highlight)
```

Examples:
```
1-1-1-2026-day          ← January 1, 2026, arc segment
1-1-1-2026-day-marker   ← marker dot for January 1, 2026
32-1-2-2026-day         ← February 1, 2026 (32nd day of year)
```

**Important:** These IDs are **rewritten every time the year changes.** `updateDayIds(year)` in `calendar-scripts.js` iterates all `path[id$="-day"]` and `path[id$="-day-marker"]` paths and rewrites each ID with the correct date components for the new year. Leap year (day 366) is handled as a special case.

Paths are selected by suffix:
```js
document.querySelectorAll('path[id$="-day"]:not([id*="lunar"])')
document.querySelectorAll('path[id$="-day-marker"]:not([id*="lunar"])')
```

### Event Highlighting on Day Paths

`highlightDateCycles(targetDate)` in `1-event-management.js` is the main function connecting user data to the SVG:

1. **Clears** all prior `.date_event` classes and `data-datecycle-*` attributes from all paths.
2. **Fetches** all user items from `localStorage` cache via `fetchDateCycleCalendars()`.
3. **Filters** to only items on active calendars.
4. **Matches** each item to SVG paths using a partial ID substring query:
   ```js
   // One-time events: match -day-{month}-{year}
   document.querySelectorAll(`path[id*="-${day}-${month}-${year}"]`)

   // Annual events (no year): match -day-{month}-
   document.querySelectorAll(`path[id*="-${day}-${month}-"]`)
   ```
5. Skips any matched path that does **not** end with `-day-marker`.
6. **Applies** to each matching `-day-marker` path:
   - CSS class `date_event` (triggers highlight styles in CSS)
   - `data-datecycle-tooltip` — tooltip text (title, time, calendar name)
   - `data-datecycle-count` — number of events on that day
   - `data-datecycle-title="1"` — flag for CSS styling
   - CSS custom property `--datecycle-highlight-color` — item's color
7. **Displays** matching items for `targetDate` in the `#pinned-datecycles` and `#current-datecycles` panel divs.

This function is triggered on: initial load, year change, sync status change, and whenever the target date changes.

### Lunar Month Paths

Lunar month arcs on the lunar ring have IDs:
```
{lunarMonthNumber}-lunarmonth-12      e.g. 1-lunarmonth-12, 7-lunarmonth-12
```

`1-lunar-scripts.js` selects and highlights the current lunar month:
```js
document.querySelectorAll('path[id*="lunarmonth-12"]')  // reset all
document.getElementById(`${lunarMonthNumber}-lunarmonth-12`)  // highlight current
```

The entire `#lunar_months-12` group is rotated to align with the target date:
```js
lunarMonths.setAttribute("transform", `rotate(${degrees}, ${centerX}, ${centerY})`);
```

### Planet Animation and the SVG Epoch

**Epoch:** The SVG encodes planet positions as of **January 1, 2026** (set in `planet-orbits.js`). This epoch angle is read once from each planet group's `transform` attribute and cached in `element.dataset.ecEpochAngle`.

`PlanetGroupRotator` calculates the angle for any date:
```
angle = epochAngle + direction × (daysSinceEpoch / orbitDays) × 360
```

Planet groups receive `rotate(deg cx cy)` SVG transforms where `cx, cy` is the center of `#sol`:
```js
this.el.setAttribute("transform", `rotate(${angleDeg} ${x} ${y})`);
```

**Counter-rotation:** The `#zodiacs` group is linked to Earth's rotator with `counterRotateId: "zodiacs"`. As Earth rotates, zodiacs apply `-angleDeg` so the zodiac ring appears fixed in space rather than spinning with the planet.

Planet orbital periods used:

| Planet | Days |
|---|---|
| Mercury | 88 |
| Venus | 224.7 |
| Earth | 365.256 |
| Mars | 686.98 |
| Jupiter | 4332.59 |
| Saturn | 10759 |
| Uranus | 30687 |
| Neptune | 60190 |

GSAP is **not** used for planet animation — it uses a vanilla `requestAnimationFrame` loop with linear interpolation. GSAP is used elsewhere (whale marker along path, other motion effects).

### Animal Cycle SVG Maps

The five animal migration cycles are separate SVG files in `cycles/`. They are toggled via `kin-cycles.js` which shows/hides the corresponding overlay containers. The whale cycle additionally animates a marker (`#whale-marker`) along a path (`#whale-year-cycle`) using GSAP `MotionPathPlugin`.

### Key SVG-Connected HTML Element IDs (in dash.html)

| ID | Purpose |
|---|---|
| `#the-cal` | Container where `earthcal-v1-2-2.svg` is injected |
| `#current-year` | SVG `<text>` element; `.querySelector('tspan')` holds the year string |
| `#prev-year`, `#next-year` | Year navigation buttons |
| `#pinned-datecycles` | Panel showing pinned events for target date |
| `#current-datecycles` | Panel showing non-pinned events for target date |
| `#date-cycle-count-box` | Event count display |
| `#event-show-hide` | Toggle button for event panel visibility |
| `#eye-icon` | Icon inside event toggle button |
| `#planet-buttons` | Palette for planet visibility toggles |
| `#kin-buttons` | Palette for animal cycle visibility toggles |
| `#moon-phase`, `#moon-info` | Moon phase display |
| `#venus-phase`, `#mars-phase`, `#jupiter-phase`, `#saturn-phase` | Planet phase displays |
| `#whale-cycle`, `#whale-info` | Whale cycle panel |
| `#offline-sync-indicator` | Sync status indicator |
| `#loading-spinner` | Boot loading spinner |
| `#form-modal-message` | Item add/edit modal |
| `#add-datecycle` | DateCycle creation modal |

---

## Online/Offline Functionality

EarthCal has **two independent offline layers** that work together.

### Layer 1 — Service Worker (`js/service-worker.js`)

Handles the **app shell** (HTML, JS, CSS, fonts, SVGs). Registered by `earthcal-init.js` on page load.

**Cache name:** `earthcal-cache-v3` (bumping the version clears old caches on activate).

**On install:** Pre-caches ~50 static assets including all HTML pages, all JS/CSS files, fonts, and key SVGs.

**Fetch strategies by request type:**

| Request type | Strategy |
|---|---|
| Page navigation (GET) | Network-first → cached `dash.html` fallback → bare `<h1>Offline</h1>` |
| Static assets (JS, CSS, fonts) | Cache-first → network fetch if not cached |
| POST to `/api/v1/list_calendars.php`, `/api/v1/get_cal_info.php`, `/api/datecycles` | Network-first → cache last response (max 8 cached API responses) |

This means the full app UI loads and renders from cache with no network connection.

### Layer 2 — Sync Store (`js/sync-store.js`)

Handles **user data** (items, calendars). Exposed as `window.syncStore`.

#### Connectivity Detection

`determineConnectivity()` runs a real HTTP probe — it does not rely solely on `navigator.onLine` (unreliable in Electron/snap):

```
1. isForcedOffline?
   → check window.isForcedOffline === true
   → check localStorage 'earthcal_forced_offline' === 'true'
   → if yes: treat as offline, skip network probe

2. checkBackendReachable()
   → GET /api/v1/get_earthcal_plans.php (no-store, no credentials)
   → any HTTP response = reachable

3. online = backendReachable OR navigator.onLine

Result cached for 18 seconds (CONNECTIVITY_CACHE_MS).
Force-refresh triggered by browser 'online'/'offline' events.
```

#### localStorage Keys (all user-namespaced)

| Key | Contents |
|---|---|
| `ec_user_{buwana_id}_outbox` | Pending operations queue (JSON array) |
| `ec_user_{buwana_id}_calendars` | Cached calendar list |
| `ec_user_{buwana_id}_items` | Cached items by calendar ID (`{calId: [items]}`) |
| `calendar_{id}` | Legacy per-calendar cache (mirrored for backwards compat) |
| `user_calendars_v1` | Calendar list mirror (also in `sessionStorage`) |

#### The Outbox Pattern

Every write goes through `enqueueChange()` before touching the server:

```
User action (create / update / delete)
        ↓
enqueueChange(operation, payload)
        ↓
1. Assign client_temp_id  (e.g. "tmp_1709481234567")
2. applyLocalChange()  →  write to localStorage cache immediately
   Item appears in UI instantly, flagged pending: true
3. Append to outbox  (ec_user_{id}_outbox)
4. determineConnectivity()
        ├─ online  →  flushOutbox()  (non-blocking async attempt)
        └─ offline →  leave in outbox, return ok: true to caller
```

#### `flushOutbox()` — Draining the Queue

Processes each outbox entry in order. Only one flush runs at a time (`flushInFlight` guard):

```
For each pending entry:
   'create'  →  POST /api/v1/add_item.php
   'update'  →  POST /api/v1/update_item.php
   'delete'  →  POST /api/v1/delete_item.php

   Success:
      reconcileServerItem()
         → replace client_temp_id with real server item_id in cache
         → clear pending: true flag
         → mark outbox entry 'sent' and remove it

   Failure:
      → mark entry status: 'error', store last_error
      → keep in outbox for next flush attempt

After flush:
   → loadInitialState()  (re-fetch authoritative server data)
```

#### Coming Back Online

```
browser 'online' event fires
        ↓
onConnectivityChange()
        ↓
determineConnectivity({ force: true })
        ↓
flushOutbox()  →  all queued offline writes sent to server
```

#### Boot Sequence (loadInitialState)

```
online:
   flushOutbox()               ← drain leftover offline ops first
   GET /api/v1/get_user_items.php
   persistCachedState()        ← update localStorage
   mirrorLegacyCaches()        ← sync legacy calendar_{id} keys

offline:
   readCachedState()           ← load from localStorage
   mirrorLegacyCaches()        ← sync legacy keys
   (return last cached data)
```

#### Wiring in 1-event-management.js

`ensureSyncStoreReady(buwanaId)` initialises the store once per user, then calls `subscribeToSyncStatusUpdates()` which registers a listener via `syncStore.onOnlineStatusChange(callback)`. The callback fires on any connectivity or pending-count change and triggers `highlightDateCycles(targetDate)` to re-render the calendar highlights (so items reflect their sync state visually).

#### Forced Offline Mode (for testing)

```js
// Force offline (developer/testing only):
window.isForcedOffline = true;
// or:
localStorage.setItem('earthcal_forced_offline', 'true');
```

---

## Key Global Functions and State

| Symbol | Defined in | Purpose |
|---|---|---|
| `initializePage()` | `core.js` | Called after all scripts load; starts the UI |
| `window.animatePlanets(startDate, targetDate)` | `planet-orbits.js` | Animate planets between two dates |
| `window.initPlanetAnimator()` | `planet-orbits.js` | Builds and returns `animatePlanets` |
| `window.syncStore` | `sync-store.js` | Offline-first data engine |
| `window.isLoggedIn()` | `login-scripts.js` | Auth check |
| `getCurrentUser()` | `login-scripts.js` | Returns current user object |
| `window.user_plan` | `login-scripts.js` | Current plan tier string |
| `targetDate` | `set-targetdate.js` | Global `Date` for the selected day |
| `startDate` | `calendar-scripts.js` | Global `Date` for animation start |
| `highlightDateCycles(targetDate)` | `1-event-management.js` | Re-render event highlights on SVG |
| `calendarRefresh()` | `calendar-scripts.js` | Refresh calendar after year change |
| `updateDayIds(year)` | `calendar-scripts.js` | Rewrite all SVG day path IDs for new year |
| `getApiBase()` | `core.js` | Resolve API base URL |
| `loadTranslations(language)` | `index.html` | Load i18n strings |

---

## Cache-Bust Version Policy

Every JS and CSS file referenced in `dash.html`, `index.html`, and `earthcal-init.js` carries a `?v=X.Y` query string for cache busting.

**Rule:** Whenever a file is modified, its `?v=` number must be incremented in **every place it is referenced** across all HTML files and `earthcal-init.js`:

- **Minor change** (bug fix, small tweak): bump the minor version by **+0.1** (e.g. `v=9.8` → `v=9.9`)
- **Major revision** (new feature, significant rewrite): bump the major version by **+1** and reset minor to 0 (e.g. `v=9.9` → `v=10.0`)

Files to check for references:
- `dash.html` — inline `<script src>` and `<link href>` tags
- `index.html` — `<link rel="preload">`, `<link rel="stylesheet">`, and `<script src>` tags
- `js/earthcal-init.js` — the `scripts[]` array and the SVG `loadSvgIntoContainer()` call

Also bump `js/service-worker.js?v=X.Y` (in `earthcal-init.js`) whenever any cached asset changes, so the service worker's install step re-fetches the updated files.

**IMPORTANT — `earthcal-init.js` itself:** After ANY code change to the project, also bump the `?v=` on the `earthcal-init.js` `<script>` tag in **both** `dash.html` and `index.html`:

```html
<!-- dash.html and index.html -->
<script src="js/earthcal-init.js?v=X.Y"></script>
```

- Minor change → `?v=X.Y` + 0.1 (e.g. `v=50` → `v=50.1`)
- Major revision → `?v=X+1.0` (e.g. `v=50.9` → `v=51.0`)

This ensures browsers reload the init orchestrator and pick up the freshly-versioned script list inside it.

---

## Common Gotchas

- **Script load order is critical.** `planet-orbits.js` must load before `calendar-scripts.js`. `sync-store.js` must load before `core.js`. Do not reorder without tracing dependencies.
- **SVG day path IDs are mutable.** They are rewritten by `updateDayIds(year)` on every year change. Never cache a day path ID across year transitions.
- **The SVG epoch is January 1, 2026.** Planet group `transform` attributes in the SVG represent positions on that date. `planet-orbits.js` reads this once and caches it in `element.dataset.ecEpochAngle`.
- **Do not use `navigator.onLine` directly** for connectivity decisions in new code — use `syncStore.getStatus()` or the `onOnlineStatusChange` listener, which probes the backend.
- **`flushOutbox` is idempotent and guarded.** Calling it multiple times concurrently is safe; the `flushInFlight` promise deduplicate concurrent calls.
- **`normalizeItem()` in sync-store.js is the canonical data shape.** All items stored in localStorage go through it to produce a consistent structure regardless of whether data came from the server or was created offline.
- **Leap year 366:** Day 366 paths have a special-case ID `366-day` / `366-day-marker` (no date components) in non-leap years. `updateDayIds` handles this.
- **Zodiacs counter-rotate.** The `#zodiacs` group is linked to Earth's `PlanetGroupRotator` via `counterRotateId`. Its `transform` is set to `-angleDeg` so it appears stationary while Earth orbits.
