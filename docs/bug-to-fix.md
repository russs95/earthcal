# EarthCal — Sync-Store Bugs to Fix

Identified during code review of `js/sync-store.js` and `js/1-event-management.js`.

---

## ✅ Fixed — Bug 1: `applyLocalChange` create branch had no deduplication
Added `findIndex` check before push; create is now idempotent.

## ✅ Fixed — Bug 2: `reconcileServerItem` `!replaced` fallback silently inserted duplicates
Replaced silent push with `console.warn` + bail-out.

## ✅ Fixed — Bug 3: Notification fired before item was written to storage
Moved `notifyStatusListeners()` to after `applyLocalChange` in `createOrUpdateItem`.

## ✅ Fixed — Bug 4: `fetchDateCycleCalendars` read from two storage sources
Removed `calendar_${calId}` loop from `fetchDateCycleCalendars`; removed per-calendar writes from `mirrorLegacyCaches`; updated `findDateCycleInStorage`, `updateDateCycleRecord`, `editDateCycle`, and the legacy `deleteDateCycle` path to read/write `ec_user_${id}_items` directly.

## ✅ Fixed — Bug 5: `loadInitialState` ↔ `flushOutbox` mutual recursion
Removed the `if (!skipReload...) { await loadInitialState(); }` block from inside `flushOutbox`. The outer `loadInitialState` caller already fetches fresh server state after the flush returns, making the internal re-fetch redundant and the deadlock impossible.

## ✅ Fixed — Bug 6: `scheduleBackgroundSync` fired redundant full refetch 350ms after every add
Wrapped `scheduleBackgroundSync('add-datecycle')` in `if (!usedSyncStore)`. The sync-store path already self-reconciles via the outbox flush; the background sync is only needed on the legacy path.

---

## Bug 7 — `highlightDateCycles` has no concurrency guard *(lower priority)*

**File:** `js/1-event-management.js` (subscription callback + `requestHighlightRefresh`)
**Status:** Still present, but lower urgency now that bugs 1–6 are resolved.

The sync-store subscription fires `highlightDateCycles` as fire-and-forget (no `await`, no dedup). `requestHighlightRefresh` fires it independently on a 120ms debounce. Both can be in flight simultaneously. The DOM write (clear + render items) is synchronous after the first `await`, so the second caller always clears the first's output — item count stays correct. **However**, SVG path attribute writes (`date_event` class, `data-datecycle-tooltip`, `--datecycle-highlight-color`) happen *after* the `updateDateCycleCount` await, meaning both executions set SVG attributes. If the two calls hold different snapshots of the data (e.g. one with `pending: true` metadata, one with `pending: false`), the last writer wins on tooltip/color but both writers touch the DOM — explaining intermittent stale SVG highlights.

With bugs 1–6 fixed, the data snapshots are much more consistent so the visual impact is minor. Still worth addressing as a follow-on.

**Proposed fix:** Add a simple "in-flight" cancellation token inside `highlightDateCycles`. Each invocation gets a token; if a newer call starts, the older one checks the token after each `await` and exits early.

```js
let highlightGeneration = 0;

async function highlightDateCycles(targetDate) {
    const generation = ++highlightGeneration;
    // ... existing SVG cleanup ...
    const rawDateCycleEvents = await fetchDateCycleCalendars();
    if (generation !== highlightGeneration) return; // superseded — bail out
    // ... rest of function unchanged ...
    await updateDateCycleCount(matchingPinned.length, matchingCurrent.length);
    if (generation !== highlightGeneration) return; // bail before SVG writes too
    // ... SVG path attribute writes ...
}
```

Two guard checks: one after the data fetch (prevents stale DOM writes) and one before SVG attribute writes (prevents stale path highlights).

---

## Recommended next step

| # | Bug | Effort | Risk if left |
|---|---|---|---|
| 7 | `highlightDateCycles` concurrency guard | ~8 lines added | Occasional stale SVG highlight after add |
