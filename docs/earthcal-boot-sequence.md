# EarthCal Boot Sequence

> **Purpose:** This document maps every stage of EarthCal's startup — from the first HTML parse to the fully interactive, animated calendar UI. The goal is to give a clear picture of every deliberate delay, async dependency, and rendering phase so we can identify and reduce boot time.

---

## Overview: Two Entry Paths

```
User visits earthcal.app
│         ▼    index.html  ─── (returning user with valid token) ──▶  dash.html
│         └─── (first-time user) ──▶  onboarding flow in index.html ──▶  dash.html
```

---

## Stage 0 — Service Worker Registration (parallel, non-blocking)

**File:** `js/earthcal-init.js` (lines 1–13), registered from both `index.html` and `dash.html`

```
window 'load' event fires
        ↓
navigator.serviceWorker.register('js/service-worker.js?v=5.1')
        ↓
Service worker installs + pre-caches ~50 assets
(CACHE NAME: earthcal-cache-v9)
```

- Runs **asynchronously in parallel** — does not block any other stage.
- On subsequent loads, the service worker serves the full app shell from cache, making `dash.html`, all JS/CSS, fonts, and SVGs available offline before any network requests.
- Pre-cached assets include `gsap.min.js`, `MotionPathPlugin.min.js`, and `1-lunar-scripts.js` — the synchronous blocking scripts in `dash.html <head>` — so returning users pay zero network cost for them.

---

## Stage 1 — index.html Parse and `initApp()` Launch

**File:** `index.html` (lines ~68–1780)

### 1a. HTML `<head>` preloads

Before any script runs, the browser processes `<link rel="preload">` tags:
- `js/earthcal-init.js?v=56.6`
- `css/1-stylesheet.css?v=8.9`, `light.css?v=7.9`, `dark.css?v=7.9`
- `assets/fonts/Mulish-Light.ttf`, `Mulish-Medium.ttf`, `Arvo-Regular.ttf`
- `svgs/earthen-icon.svg`
- Arrow SVG icons (dark and light variants, 8 files)

### 1b. Script loads (inline `<head>`)

All loaded before `<body>` content renders:
- `js/earthcal-config.js` — config constants
- `js/earthcal-init.js?v=56.6` — the boot orchestrator (sets `DOMContentLoaded` listener)

### 1c. `initApp()` — the index.html gate

Fires via IIFE at bottom of `index.html` inline script block (line ~1770). Checks for a `window.__EARTHCAL_HAS_FIRST_TIME__` flag set earlier in the page:

```
(async function initApp() {
    if (hasFirstTimeFlag) → handleFirstTimeFlow()
    else                  → handleDefaultFlow()
})()
```

---

## Stage 2a — Default Flow (Returning User)

**Function:** `handleDefaultFlow()` in `index.html`

```
1. preloadAssets()
   → collectPreloadAssets() — gathers all <link rel="preload">, <link rel="stylesheet">,
     <script src>, <img src> URLs
   → fetch each asset with { cache: 'force-cache' } in parallel (Promise.all)
   → progress bar animates via requestAnimationFrame (easeOutCubic)
   → DELAY: minimum 330ms enforced (MINIMUM_REDIRECT_DELAY_MS)
     → if assets loaded faster than 330ms, await delay(330 - elapsed)

2. setLoadingProgress(100)

3. window.location.href = "dash.html" + search params
   → HARD REDIRECT to dash.html
```

**Total minimum time: ~330ms** (the redirect delay floor).

---

## Stage 2b — First-Time User Flow

**Function:** `handleFirstTimeFlow()` in `index.html`

```
1. preloadAssets() — same parallel fetch with progress bar

2. Hide #initial-load, show #onboarding-time, #onboarding-section

3. runFirstTimeOnboarding() — async multi-task sequence:
   Each task runs via runTask(label, action):
     → Shows spinner in task log
     → Runs action (API call)
     → MINIMUM TASK DURATION: 3600ms per task (MIN_TASK_DURATION_MS)
       → If action completes faster, await delay(3600 - elapsed)
     → Replaces spinner with green checkmark on success

   Tasks in sequence (each minimum 3600ms):
     Task 1: Verify / create Buwana account  (POST /api/v1/check_buwana_account.php)
     Task 2: Create or confirm "My Calendar" (POST /api/v1/add_new_cal.php)
     Task 3: Subscribe to Astronomical Events calendars
     Task 4: Create EarthCal Anniversary event
     Task 5: Create practice events

   After all tasks:
     → Show completion message
     → Show "Get Started" button
     → User clicks button → redirect to dash.html?status=firsttime
```

**Total minimum time for first-time flow: 5 × 3600ms = ~18 seconds minimum** (by design — intended as a visible onboarding ceremony).

---

## Stage 3 — dash.html Parse

**File:** `dash.html` (lines 1–602)

### 3a. Immediate first paint — Boot Overlay

The very first thing rendered on screen is `#boot-overlay`, defined by an **inline `<style>` block in `<head>`** and placed as the first child of `<BODY>`. It requires no JS, no external stylesheet, and no DOMContentLoaded.

```
Browser begins parsing dash.html
        ↓
Inline <style> in <head> processed — #boot-overlay CSS available
        ↓
<BODY> tag parsed → #boot-overlay div rendered immediately
        ↓
User sees: full-page white (light) or #111 (dark) background
           with a 15px #ffd900 pulsing circle at center
```

The overlay pulses between 15 px and 20 px diameter every second (`@keyframes pulse-boot`), giving immediate visual feedback while the rest of the page loads. It is dismissed by `initCalendar()` in its `finally` block once the calendar is fully ready.

### 3b. `<head>` preloads (asset hints, non-blocking)

SVG arrows (dark + light), earthcal-spinner.svg preloaded.

### 3c. Synchronous `<script>` loads in `<head>`

Executed in order before any body content (but `#boot-overlay` is already visible):
```
1. js/gsap.min.js              — GSAP animation engine
2. js/MotionPathPlugin.min.js  — GSAP orbital path plugin
3. (inline) gsap.registerPlugin(MotionPathPlugin)
4. (inline) displayMoonPhaseOnHover() helper function
5. js/1-lunar-scripts.js?v=3.1 — lunar calculations
6. (inline) initializePage() function definition (the ROLL CALL)
```

For returning users, all three JS files are served instantly from service worker cache (added to `STATIC_ASSETS` in `service-worker.js`). The blocking time is negligible.

Note: `earthcal-config.js` and `earthcal-init.js?v=56.6` are also referenced in `dash.html` — these trigger the `DOMContentLoaded → initCalendar()` listener.

---

## Stage 4 — `initCalendar()` — The Script Loader

**File:** `js/earthcal-init.js`, function `initCalendar()`

Fires on `DOMContentLoaded`. The boot overlay is already visible at this point.

```
Step 1: Show #loading-spinner (class="hidden" → remove class)
        (sits behind boot-overlay at z-index 1000; becomes visible after overlay is removed)

Step 2: loadSvgIntoContainer('cals/earthcal-v1-2-2.svg?v=21.2', 'the-cal')
         → await fetch of 1.5MB SVG
         → inject raw SVG HTML into <div id="the-cal">
         → ALL SVG elements become live DOM nodes
         (BLOCKING: scripts cannot wire SVG listeners until this completes)

Step 3: Preload all scripts in parallel (Promise.all of <link rel="preload">):
         js/suncalc.min.js
         js/auspicer.js?v=3.3
         js/auspices/biodynamic_council.js?v=1.0
         js/auspices/ancestral_examples.js?v=1.0
         js/sync-store.js?v=2.5
         js/astronomy.browser.js
         js/core.js?v=4.0
         js/1-gcal-javascripts.js?v=3.23
         js/breakouts.js
         js/set-targetdate.js?v=1.1
         js/time-setting.js?v=11.2
         js/planet-orbits.js?v=9.3
         js/login-scripts.js?v=22.2
         js/item-management.js?v=11.6
         js/calendar-scripts.js?v=3.0

Step 4: Load scripts SEQUENTIALLY (await each in order):
         (same list as above — each script tag appended to <head> with defer)

Step 5: Load dark-mode-toggle.mjs.js as ES module (non-awaited append)

Step 6: Call initializePage()

Step 7 (finally):
         → Hide #loading-spinner (classList.add("hidden"))
         → Remove #boot-overlay from DOM (document.getElementById("boot-overlay").remove())
         → Calendar is now fully visible and interactive
```

**The SVG fetch (Step 2) is the single largest blocking operation** — the 1.5MB SVG must fully download and be injected before any scripts execute.

### Script load order rationale

| Script | Why this position |
|---|---|
| `suncalc.min.js` | Required by `auspicer.js` and `1-lunar-scripts.js` |
| `auspicer.js` | Extends SunCalc; must follow suncalc |
| `sync-store.js` | Offline engine must be early; `core.js` calls into it |
| `astronomy.browser.js` | Large lib (422KB); loaded early so it's ready |
| `core.js` | Defines `initializePage()` caller and global helpers |
| `planet-orbits.js` | Must precede `calendar-scripts.js` which calls `animatePlanets()` |
| `calendar-scripts.js` | Last — depends on planet animator being available |

---

## Stage 5 — Per-Script `DOMContentLoaded` Handlers

Several scripts wire their own `DOMContentLoaded` listeners. Because these scripts are injected **after** `DOMContentLoaded` has already fired, the browser fires queued listeners immediately. These all execute synchronously during the sequential script load in Stage 4:

- **`planet-orbits.js`** (line 727): Wires click listeners for all planet SVG groups.
- **`login-scripts.js`** (lines 288, 784, 801): Three separate `DOMContentLoaded` handlers:
  - Wires the Buwana auth button
  - Waits for `#reg-up-button` element then populates user greeting
  - Attaches connectivity change listener
- **`time-setting.js`** (end of file): Calls `applyInitialLayerVisibility()` which sets up `setTimeout` delays for zodiac/lunar/comet reveals (see Stage 7 below).

---

## Stage 6 — `initializePage()` — The ROLL CALL

**File:** `dash.html` (inline `<script>`, lines 275–520)

This is the central orchestration function. It runs **after all scripts have loaded sequentially**.

### 6a. DOM Element Roll Call

Grabs references to key SVG groups and UI elements:
- `#solar-system-center`, `#days-of-year-lines`, `#all-daymarkers`
- `#white-back-for-day`, `#header`, `#ray_lines`
- `#bottom-left-buttons`, `#the_year`, `#zodiacs`, `#lunar_months-12`

Immediately sets `bottomButtons.style.pointerEvents = 'none'` to block interaction during animation.

### 6b. Timed Reveal Sequence

All four timeouts start at the same moment (no chaining — they run independently off the same `t=0` baseline):

| Delay | What reveals |
|---|---|
| `t + 1500ms` | `setYearsMonthsOn()`, `updateTargetMonth()`, Hijri labels, lunar ring rotation |
| `t + 2000ms` | `#days-of-year-lines` opacity → 1, `#ray_lines` opacity → 1 |
| `t + 2500ms` | `updateTargetDay()` — target day highlighted on ring |
| `t + 3000ms` | `#all-daymarkers`, `#the_year`, `#header`, `#bottom-left-buttons` opacity → 1, pointer-events → auto |

**Total reveal sequence: 3 seconds.**

### 6c. Synchronous initialization (fires immediately, no delay)

```
updateBackgroundColor()      — Day/night theme color
updateHighlightColor()       — Accent color
Parse URL params / sessionStorage for shared event or ?status=firsttime
setCurrentDate()             — Sets global startDate + targetDate
window.initPlanetAnimator()  — Build PlanetGroupRotator instances
window.animatePlanets(startDate, targetDate)  — Start planet rAF loop
cyclesToggleSimplified()     — Show/hide animal cycle overlays
initializeToggleListener()   — Datecycle panel toggle
updateDayIds(currentYear)    — Rewrite all SVG day path IDs for current year
updateDayTitles(currentYear) — Set title attributes on day paths
title2tooltip()              — Wire tooltip titles on non-date paths
title2datetip()              — Wire tooltip titles on date paths
triggerPlanets()             — Enable planet click triggers
listenForMonthBreakout()     — Month arc click → breakout panel
listenForCloseBreakout()     — Breakout close button
attachBreakoutTouchListeners() — Mobile touch for breakout
addMoonPhaseInteraction()    — Moon hover interaction
updateMoonPhase(targetDate)  — Display initial moon phase
addDayPathEventListeners()   — Day path click/hover listeners
resetMoonPhase()             — Reset moon to target date
openPlanetInfoBox()          — Initialize planet info panel
```

### 6d. `t + 1500ms` setTimeout

```javascript
setTimeout(function () {
    startDate = targetDate;             // Reset animation origin
    setYearsMonthsOn();                 // Show year/month labels on SVG
    updateTargetMonth();                // Highlight current month ring
    calculateHijriMonthNames(currentYear);
    setLunarMonthForTarget(targetDate, currentYear);  // Rotate lunar ring
}, 1500);
```

### 6e. `t + 2500ms` setTimeout

```javascript
setTimeout(updateTargetDay, 2500);
// Updates the target day highlight on the SVG day ring
```

### 6f. Optional upgrade modal — `t + 200ms` setTimeout

```javascript
if (shouldShowJediUpgrade) {
    setTimeout(() => { manageEarthcalUserSub(); }, 200);
}
```

### 6g. Async: `await getUserData()`

This is the **main async data loading sequence**. Everything from 6c onwards runs, then execution reaches `await getUserData()`:

```
getUserData() in login-scripts.js:
  1. isLoggedIn() check
     → if not logged in: useDefaultUser(), return early
  2. Cache auth payload to sessionStorage + localStorage
  3. POST /api/v1/check_user_sub.php  — subscription/plan lookup
     → Sets window.user_plan ('padwan', 'jedi', or 'master')
  4. displayUserData() + setCurrentDate()
  5. syncStore.initSyncStore({ buwana_id })
     → sets up localStorage keys, registers connectivity listeners
  6. await syncStore.loadInitialState()
     → if online:
         flushOutbox()  — drain any pending offline writes
         GET /api/v1/get_user_items.php  — fetch all items
         persistCachedState()  — write to localStorage
         mirrorLegacyCaches()
     → if offline:
         readCachedState()  — load from localStorage
         mirrorLegacyCaches()
  7. showLoggedInView(calendars)
  8. await syncDatecycles()
     → calls syncStore.loadInitialState() again (secondary sync)
```

### 6h. After `getUserData()` resolves

```
displayDayInfo(targetDate, userLanguage, userTimeZone)

Check syncStore connectivity:
→ if offline: initializeOfflineMode()
if buwana_id:
  → if online: syncDatecycles().then(() => highlightDateCycles(targetDate))
  → if offline + forced-offline enabled: highlightDateCycles(targetDate)
  → if offline + no offline mode: showOfflineAlert(msg)
else (not logged in):
  → if offline + forced-offline mode: highlightDateCycles(targetDate)
if userClock: openClock(userTimeZone)
```

---

## Stage 7 — `time-setting.js` Layer Reveals

**File:** `js/time-setting.js`, function `applyInitialLayerVisibility()` (line ~1103)

Called during script load (Stage 4) via `DOMContentLoaded`. Sets up a parallel set of `setTimeout` reveals for optional calendar layers:

```javascript
const layerRevealDelayMs = 3000;

// Zodiac ring
if (userZodiacPositions) {
    setTimeout(() => {
        setZodiacVisibility(true);
        updateZodiacGroundShade(zodiacShadeSetting);
    }, 3000);
}

// Lunar calendar
if (userLunarCalendar) {
    setTimeout(() => { setLunarCalendarVisibility(true); }, 3000);
}

// Comet 3I/ATLAS
if (userCometTracking) {
    setTimeout(() => { setCometTrackingVisibility(true); }, 3000);
}
```

These fire at `t + 3000ms` — aligned with the final wave in the Stage 6 reveal sequence. All calendar layers complete at the **3-second mark**.

---

## Stage 8 — Boot Overlay Dismissed, Calendar Interactive

When `initializePage()` resolves (after `getUserData()` returns), the `finally` block in `initCalendar()` runs:

```javascript
finally {
    spinner.classList.add("hidden");         // hide #loading-spinner
    document.getElementById("boot-overlay").remove();  // remove overlay from DOM
}
```

The boot overlay is removed from the DOM entirely. The fully-initialized calendar is now visible. At this point:
- All SVG day path event listeners are wired
- Planet animation loop is running
- User data is loaded and event highlights are rendered
- All UI buttons are interactive (`pointerEvents: auto`)

---

## Stage 9 — Post-Load Ongoing Timers

After full initialization, the following intervals and timers remain active:

| Timer | Interval | Purpose | File |
|---|---|---|---|
| `updateTimeInterval` | `setInterval(updateTime, 1000)` | Clock tick | `time-setting.js:76` |
| `clockInterval` | `setInterval(setClockHands, 100)` | Analog clock hands | `time-setting.js:980` |
| Connectivity cache | 18,000ms TTL | `syncStore.determineConnectivity()` result cache | `sync-store.js:450` |
| `scheduleBackgroundSync` | 350ms debounce | Debounced re-sync after user actions | `1-event-management.js:2898` |
| Offline banner auto-hide | 5000ms | Auto-hides the offline notification banner | `login-scripts.js:666` |

---

## Complete Timeline (Happy Path — Returning Logged-In User)

```
T = 0ms      Browser parses index.html <head>, begins preload hints
T ≈ 0ms      earthcal-init.js sets DOMContentLoaded listener on index.html
T ≈ 0ms      index.html initApp() fires — begins preloadAssets()
T ≈ ?ms      All preload assets fetched (parallel, time varies)
T ≥ 330ms    MINIMUM_REDIRECT_DELAY enforced if assets loaded fast
T = 330ms+   window.location.href = 'dash.html'  ←── REDIRECT
```

--- dash.html begins ---

```
T' = 0ms     dash.html parse begins
T' ≈ 0ms     Inline <style> in <head> processed → #boot-overlay CSS ready
T' ≈ 0ms     <BODY> tag parsed → #boot-overlay div rendered
             ✅ User sees pulsing #ffd900 circle immediately — no blank screen
T' ≈ 0ms     gsap.min.js, MotionPathPlugin.min.js load (from SW cache — fast)
T' ≈ 0ms     1-lunar-scripts.js loads (from SW cache — fast)
T' ≈ 0ms     DOMContentLoaded fires → initCalendar() begins
T' ≈ 0ms     #loading-spinner shown (behind boot-overlay)
T' ≈ ?ms     AWAIT: fetch + inject 1.5MB SVG  ←── single biggest blocking step
T' ≈ ?ms     AWAIT: Promise.all preload hints for 15 scripts
T' ≈ ?ms     SEQUENTIAL script loads begin:
               suncalc → auspicer → sync-store → astronomy → core →
               gcal → breakouts → set-targetdate → time-setting →
               planet-orbits → login-scripts → item-management → calendar-scripts
T' ≈ ?ms     dark-mode-toggle.mjs.js appended (module, non-awaited)
T' ≈ ?ms     initializePage() called
T' ≈ ?ms     SVG DOM roll call + sync inits fire immediately
T' + 200ms   (conditional) Jedi upgrade modal
T' + 1500ms  setYearsMonthsOn, updateTargetMonth, Hijri labels, lunar ring
T' + 2000ms  Day lines + ray lines fade in
T' + 2500ms  updateTargetDay — target day highlighted
T' + 3000ms  Day markers + year label + header + bottom buttons fade in
             Zodiac ring + lunar ring + comet layer fade in (time-setting.js)
             ✅ All calendar layers revealed at 3 seconds

Async (overlapping, duration varies by network):
  T' + ?ms   await getUserData() starts:
               → POST check_user_sub.php
               → syncStore.initSyncStore()
               → GET loadInitialState / get_user_items.php
               → showLoggedInView()
               → syncDatecycles()
  T' + ?ms   highlightDateCycles(targetDate) — event dots appear on calendar
  T' + ?ms   finally block fires:
               → #loading-spinner hidden
               → #boot-overlay removed from DOM
             ✅ Calendar fully interactive, no overlay
```

---

*Last updated: 2026-04-07*
