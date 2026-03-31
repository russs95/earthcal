# EarthCal Bug List
*Last updated: 2026-03-29*

Bugs are grouped by urgency. File references include line numbers where confirmed.

---

## CRITICAL — Causes crashes or data loss

### BUG-001: Null dereference crash on load
**File:** `js/calendar-scripts.js` line 5
**Description:** `document.getElementById('current-year').querySelector('tspan')` is called without a null check. If the SVG hasn't injected yet or the element is missing, this throws `TypeError: Cannot read properties of null` and halts the entire calendar-scripts module.
```js
// Current (line 5)
const currentYearText = document.getElementById('current-year').querySelector('tspan');

// Fix
const _yearEl = document.getElementById('current-year');
const currentYearText = _yearEl ? _yearEl.querySelector('tspan') : null;
```

### BUG-002: Duplicate function definition silently overrides earlier one
**File:** `js/calendar-scripts.js` lines 87 and 100
**Description:** `updateDayTitles(year)` is defined twice. JavaScript silently ignores the first definition — if the two versions ever differ during a future edit, bugs will be hard to trace.
**Action:** Remove one of the definitions (verify they are identical first, then delete lines 87–97).

---

## HIGH — Feature-breaking or data-integrity risk

### BUG-003: Memory leak — duplicate event listeners accumulate on year change
**File:** `js/calendar-scripts.js` lines 451–472 (`addDayPathEventListeners`)
**Description:** `addDayPathEventListeners()` attaches `mouseover`, `mouseout`, `click`, and `touchend` listeners to all 365+ day paths. It is called every time the year changes. Because no `removeEventListener` call precedes the `addEventListener` calls, each year-change adds a fresh copy of every listener. After 5–10 year navigations the element has 5–10 handlers per event.
**Impact:** Memory grows continuously; hover/click events fire multiple times causing visual glitches and incorrect data display.
**Fix:** Switch to event delegation — attach a single listener to the `#EarthCycles` SVG element and filter by `event.target`, or call `removeEventListener` with the same named function references before re-adding.

### BUG-004: `navigator.onLine` used directly, contradicting the documented pattern
**Files:** `js/1-event-management.js` lines 114–115, 135, 3103; `js/login-scripts.js` lines 373, 396, 430, 773, 779, 833, 1153, 2241, 2361, 2752, 2886, 2963; `js/core.js` line 360
**Description:** CLAUDE.md explicitly warns *"Do not use `navigator.onLine` directly for connectivity decisions in new code — use `syncStore.getStatus()` or the `onOnlineStatusChange` listener."* Despite this, `navigator.onLine` is called raw in ~15 locations outside `sync-store.js`. In Electron/snap environments `navigator.onLine` reports `true` even with no real connectivity, so these guards will fail silently.
**Impact:** Offline sync UI shows incorrect state; operations believed to be online-safe are queued incorrectly.
**Fix:** Replace all bare `navigator.onLine` reads (outside `sync-store.js`) with `syncStore.getStatus().backendReachable` or the `onOnlineStatusChange` callback.

### BUG-005: `modal` element not null-checked before use in `closeTheModal()`
**File:** `js/calendar-scripts.js` around the modal-close logic
**Description:** The `modal` variable is used without checking whether `document.getElementById('form-modal-message')` returned null, while the inner `box` variable is checked. If the element is absent from the DOM (e.g., before full init), calling `.classList.remove()` on null crashes the function.
**Fix:** Add `if (!modal) return;` immediately after the getElementById call.

---

## MEDIUM — Visible bugs or degraded behaviour

### BUG-006: `innerHTML +=` in loops causes DOM thrashing
**File:** `js/kin-cycles.js` lines 247, 291, 1735; `js/1-event-management.js` line 1438
**Description:** Each `innerHTML +=` forces the browser to serialise the existing DOM subtree, concatenate the new HTML string, and re-parse it back into the DOM — repeated for every iteration of the loop (4× for whale info). This is slow and can lose references to nested child nodes.
```js
// Current (kin-cycles.js ~247)
for (let j = 0; j < informationOrder.length; j++) {
    whaleInfoDiv.innerHTML += `${nearestJson[informationOrder[j]]}<br>`;
}

// Fix
const parts = informationOrder.map(k => nearestJson[k]);
whaleInfoDiv.innerHTML = parts.join('<br>') + '<br>';
```

### BUG-007: Service worker `limitCacheSize` deletes only one entry per call
**File:** `js/service-worker.js` — `limitCacheSize()` function
**Description:** When the cache exceeds `maxItems`, only `keys[0]` is deleted. If multiple entries are over the limit (e.g., limit is 8 and 12 entries exist), subsequent fetches must each trigger their own delete call. The limit is never enforced atomically.
```js
// Fix: delete all excess at once
const excess = keys.length - maxItems;
if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map(k => cache.delete(k)));
}
```

### BUG-008: Race condition — overlapping planet animations on rapid year navigation
**File:** `js/planet-orbits.js` — `animatePlanets()` / `durationForDayJump()`
**Description:** Clicking prev/next year quickly triggers multiple concurrent `requestAnimationFrame` animation loops. Each loop writes `transform` attributes independently, producing jittery or reversed planet positions. There is no cancellation of the prior loop before starting a new one.
**Fix:** Store the current animation frame ID (`let rafId`) and call `cancelAnimationFrame(rafId)` before starting a new animation.

### BUG-009: Script load failures silently continue initialization
**File:** `js/earthcal-init.js` — `loadScript()` / `s.onerror`
**Description:** When a script fails to load, `onerror` logs the error but calls `resolve()`, allowing the init sequence to continue. If the failed script is `core.js`, `sync-store.js`, or `login-scripts.js`, subsequent calls to functions they define throw `ReferenceError` with no user-visible indication.
**Fix:** Track which scripts failed. If a critical script fails, show a user-facing error ("Could not load EarthCal — try refreshing") and halt the sequence rather than proceeding silently.

---

## LOW — Minor issues or edge cases

### BUG-010: Regex recompiled on every animation frame
**File:** `js/planet-orbits.js` — `parseRotateDegrees()`
**Description:** The regex `/rotate\(\s*([-+0-9.]+)/` is created inside the function, so it is recompiled on every call. At 60 fps with 8 planets this is ~480 regex compilations per second.
**Fix:** Hoist to module scope: `const ROTATE_RE = /rotate\(\s*([-+0-9.]+)/;`

### BUG-011: Redundant null/object guard misses `null` case
**File:** `js/sync-store.js` — `persistCachedState()` area
**Description:** `itemsByCalendar && typeof itemsByCalendar === 'object'` passes for `null` because `typeof null === 'object'`. The `&&` short-circuits on null (so it's safe in practice), but the pattern is brittle — a refactor that changes the order could reintroduce the null-pass-through bug.
**Fix:** Use `itemsByCalendar !== null && typeof itemsByCalendar === 'object' && !Array.isArray(itemsByCalendar)`.

### BUG-012: Commented-out touchstart / touchcancel listeners create confusion
**File:** `js/calendar-scripts.js` lines 468, 470
**Description:** Two touch event listeners are commented out immediately adjacent to an active `touchend` listener, with no explanation of why. This makes it ambiguous whether they were intentionally removed or are broken.
**Action:** Either remove the commented lines or add a comment explaining why they are disabled.
