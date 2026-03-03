# EarthCal Offline/Online Logic

EarthCal is designed to work without an internet connection. You can open the app, see your calendar, and add new events even when you're completely offline — and everything syncs automatically when you reconnect. This page explains how that works under the hood.

---

## The Big Picture: Two Independent Layers

The offline capability is built from two separate systems that each handle a different concern:

1. **The Service Worker** — makes sure the *app itself* (the HTML, CSS, JavaScript, fonts, and SVG files) loads even with no network
2. **The Sync Store** — makes sure your *data* (events, calendars, to-dos) is available offline and gets synced to the server when you reconnect

These two systems operate independently. The service worker doesn't know anything about your calendar data, and the sync store doesn't know anything about caching JavaScript files. Together they cover everything.

---

## Layer 1: The Service Worker — Keeping the App Shell Alive

`js/service-worker.js` is a browser service worker — a script that runs in the background, separate from the page, and intercepts every network request the app makes.

### What Gets Pre-Cached

When the service worker installs for the first time, it immediately downloads and caches about 50 static files — everything needed to run the app without a server:

- All HTML pages (`index.html`, `dash.html`, `billing-cancel.html`, etc.)
- All JavaScript files (the full app logic)
- All CSS files and fonts
- Key SVG icons and images
- The whale migration cycle data (`whale-cycle.json`)

This happens silently in the background when you first visit EarthCal. After that, the app can open instantly from cache even before any network request completes.

The cache is versioned (currently `earthcal-cache-v3`). When a new version of the app is deployed, bumping this version number causes the service worker to delete the old cache and pre-cache all the new files on its next install.

### How Requests Are Handled

Not all requests are treated the same way. The service worker uses different strategies depending on what's being requested:

**For page navigation** (when you open or refresh the app):
The service worker first tries to fetch the latest version from the network. If that fails (no internet), it falls back to the cached `dash.html`. If even that isn't available, it returns a bare "Offline" HTML page so the browser doesn't just show an error.

**For static assets** (JavaScript, CSS, fonts, SVGs):
These are served from cache immediately. If something isn't in the cache yet, it fetches it from the network and caches it for next time. This makes the app feel fast — assets load from local storage rather than waiting for network round trips.

**For certain API calls** (specifically `list_calendars.php`, `get_cal_info.php`, and `/api/datecycles`):
These are network-first: the service worker always tries to get fresh data, but if the network is down, it falls back to the last cached response. The cache holds a maximum of 8 API responses to keep things tidy.

The practical result: if you opened EarthCal recently while online, you can close the browser, disconnect from the internet, reopen EarthCal, and the app will load fully — you'll see your calendar, your data, and all the UI.

---

## Layer 2: The Sync Store — Keeping Your Data Safe Offline

The service worker handles the app shell, but it doesn't help with the dynamic user data — your events, to-dos, and calendars. That's the job of `js/sync-store.js`, which exposes itself as `window.syncStore`.

The sync store's core philosophy is **local-first**: every change you make is written to your browser's local storage immediately, and the server is updated in the background. From the UI's perspective, your data is always "saved" — the only question is whether it's been sent to the server yet.

### How the Sync Store Knows If You're Online

Checking connectivity sounds simple, but `navigator.onLine` — the browser's built-in connection flag — turns out to be unreliable. It often says "online" even when the network is present but the server is unreachable (common on captive wifi portals, flaky mobile connections, or in the Electron desktop app).

So instead, the sync store does a real HTTP probe: it makes an actual request to `/api/v1/get_earthcal_plans.php` and checks whether any response comes back. If the server responds at all, it considers itself online. This is cached for 18 seconds so it's not hitting the network constantly.

The connectivity check also listens to the browser's `online` and `offline` events. When the browser thinks the connection has changed, it immediately does a fresh probe and — if you've just come back online — kicks off a sync.

There's also a **forced offline mode** for development and testing:

```js
// Force the app into offline mode regardless of actual network:
window.isForcedOffline = true;
// or via localStorage (persists across page loads):
localStorage.setItem('earthcal_forced_offline', 'true');
```

### Where Data Is Stored Locally

Everything is stored in `localStorage` under user-namespaced keys, so multiple users on the same device don't interfere with each other. The user's `buwana_id` is part of every key:

| Key | What's in it |
|---|---|
| `ec_user_{buwana_id}_outbox` | The queue of changes that haven't been sent to the server yet |
| `ec_user_{buwana_id}_calendars` | A cached copy of all the user's calendars |
| `ec_user_{buwana_id}_items` | A cached copy of all items, organized by calendar ID |
| `calendar_{id}` | A legacy per-calendar cache, maintained for backwards compatibility |
| `user_calendars_v1` | A mirrored copy of the calendar list, also written to `sessionStorage` |

### The Outbox: Write Now, Sync Later

The key to the offline experience is the **outbox pattern**. Every time you create, edit, or delete an item, the change goes through `enqueueChange()`. Here's what happens:

1. **The item is written to local storage immediately.** The UI updates right away. From your perspective, the item is saved.
2. **The change is added to the outbox queue.** The outbox is a JSON array in `localStorage` that holds all the operations that need to be sent to the server.
3. **If you're online, an immediate sync attempt is made.** The sync runs in the background — you don't have to wait for it.
4. **If you're offline, the change just sits in the outbox** until you reconnect. The UI shows the item as pending (with a visual indicator), but it's fully usable.

Each outbox entry gets a `client_temp_id` — a temporary identifier like `tmp_1709481234567` — that's used to track the item until the server assigns it a real `item_id`.

### Flushing the Outbox

When the sync store determines there's a network connection, it calls `flushOutbox()`. This function works through the outbox queue one entry at a time:

- A **create** operation hits `POST /api/v1/add_item.php`
- An **update** operation hits `POST /api/v1/update_item.php`
- A **delete** operation hits `POST /api/v1/delete_item.php`

When an operation succeeds, the sync store does something important: it runs `reconcileServerItem()`, which replaces the temporary `client_temp_id` with the real server-assigned `item_id`, clears the `pending` flag on the item in local storage, and removes the entry from the outbox. At this point the item is fully confirmed.

When an operation fails (network error, server error), the entry is marked with `status: 'error'` and kept in the outbox. It will be retried on the next sync attempt.

Only one flush can run at a time. If something triggers a second flush while one is already in progress, the second call just joins the first one's promise — there's no double-sending of data.

After a successful flush, the sync store re-fetches the full state from the server (`loadInitialState()`), so the local cache always ends up consistent with the server.

### What Happens When You Come Back Online

When the browser fires an `online` event, the sync store immediately does a fresh connectivity probe. If the backend is reachable, it calls `flushOutbox()` and all your offline changes get sent to the server automatically. No manual action needed.

### What Happens When the App First Loads

On boot, `loadInitialState()` runs:

- **If online:** First it flushes any leftover offline changes from a previous session. Then it fetches the full, authoritative list of calendars and items from `GET /api/v1/get_user_items.php` and writes the result to local storage.
- **If offline:** It reads whatever was last cached in local storage and uses that. You see your data from the last time you were online.

### How the UI Stays in Sync

`1-event-management.js` connects the sync store to the calendar display. When the sync store is initialized for a user, it registers a listener via `syncStore.onOnlineStatusChange(callback)`. This callback fires whenever:

- The number of pending (unsynced) items changes
- The online/offline state changes

When either of these happens, `highlightDateCycles(targetDate)` is called, which re-renders the event highlights on the SVG calendar. This means the calendar display always reflects the current state of your data — including items that are still pending sync.

The `#offline-sync-indicator` element in the dashboard UI surfaces the sync status to the user, showing when items are pending and whether any sync errors have occurred.

---

## Summary: What This Means Day-to-Day

For a developer working on EarthCal, the key things to keep in mind:

**Always write data through the sync store.** Don't make direct `fetch()` calls to the API to create or modify items. Use `syncStore.createOrUpdateItem()` and `syncStore.deleteItem()` so that the offline outbox is maintained correctly.

**Don't check `navigator.onLine` directly.** Use `syncStore.getStatus()` to get the current connectivity state, or subscribe via `syncStore.onOnlineStatusChange()`. The sync store's connectivity assessment is more reliable because it probes the actual backend.

**Local storage is the source of truth, not the API.** The UI reads from the local cache, not directly from the server. The server is the destination for writes, but it's always authoritative data that flows *into* local storage after a sync — the UI always reads *from* local storage.

**The `normalizeItem()` function defines the data shape.** All items passing through the sync store (whether they came from the server or were created offline) are run through `normalizeItem()` in `sync-store.js`. This function produces a consistent structure regardless of the data's origin. If you're adding new item fields, this is where the normalization logic lives.

**Offline errors are surfaced, not silently dropped.** If a sync operation fails, the outbox entry is marked with `status: 'error'` and the UI indicator shows it. Future sync attempts will retry the failed operations. There's no silent data loss.
