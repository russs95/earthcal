# EarthCal Stack Overview

Welcome to EarthCal. This document is a orientation guide for new developers — it walks through the project's purpose, architecture, and the key patterns you'll encounter when working on the codebase.

---

## What Is EarthCal?

EarthCal is a circular calendar app. The core idea is that modern time management has become disconnected from the natural world, and EarthCal tries to fix that. Instead of a grid of squares, users get a circular visualization where they can see their personal events and to-dos in relationship to the moon's phases, the positions of the planets, the signs of the zodiac, and the seasonal migrations of animals.

The philosophical inspiration comes from cultures — particularly the Igorot people of the Philippines — that historically centered their lives around ecological and celestial cycles. The practical result is something that functions like a calendar app but feels more like a living map of the solar system.

**Live at:** earthcal.app / calendar.earthen.io
**Version:** 1.1.3
**Author:** Russell Maier

---

## The Technology Stack at a Glance

EarthCal is deliberately built without any JavaScript framework. The frontend is vanilla JS, which means no React, no Vue, no build step. What you see in the files is what runs in the browser.

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript + inline SVG manipulation |
| Animation | GSAP (planet/animal effects), vanilla `requestAnimationFrame` (planet orbits) |
| Backend | PHP with PDO |
| API | REST, at `/api/v1/` |
| Database | MySQL (schema in `api/v1/new_db.sql`) |
| Auth | Buwana OAuth/OIDC (`buwana.ecobricks.org`) |
| Offline | Service Worker + localStorage outbox (see the offline/online wiki page) |
| Billing | Stripe (checkout sessions, webhooks, customer portal) |
| Desktop | Electron wrapper for Mac/Windows |
| PWA | `js/service-worker.js` + `site.webmanifest` |
| Astronomical math | `astronomy.browser.js`, `suncalc.min.js` |
| Calendar conversion | `hijri-js.common.min.js` (Islamic calendar) |

---

## The Three HTML Pages

The app is split into three main pages, each with a distinct role:

**`index.html`** is the public landing page. It shows marketing content, a guided tour of EarthCal's cycle features, and a live preview of the circular calendar. It also checks whether the visitor is already logged in and redirects them if so. Translation/i18n is loaded here too.

**`login.html`** is a very thin redirect page — it exists purely to check `sessionStorage` and `localStorage` for Buwana auth tokens, then route the user to either `auth/callback/` (if already logged in) or `dash.html` (first time). There's almost no UI.

**`dash.html`** is where the real app lives. It's the calendar dashboard for authenticated users: the circular SVG calendar, all the controls, modals, item panels, and settings.

There are also `share.html` (for shared calendar links), `billing-success.html`, and `billing-cancel.html` for the Stripe payment flow.

---

## How the App Boots

Everything starts with **`js/earthcal-init.js`**, which listens for `DOMContentLoaded` on `dash.html` and runs `initCalendar()`. This function is the conductor — it sequences the loading of every other piece of the app.

Here's why the boot order matters: the circular calendar is a large SVG file that lives separately at `cals/earthcal-v1-2-2.svg`. It's not embedded in the HTML — it's fetched and injected at runtime into a container `<div id="the-cal">`. **This has to happen first**, before any scripts run, because the scripts wire event listeners and manipulate SVG elements that need to already exist in the DOM.

After the SVG is in place, scripts are loaded one by one in a specific order:

```
suncalc.min.js          ← sun and moon rise/set calculations (no dependencies)
sync-store.js           ← offline data engine (must be up before any data access)
astronomy.browser.js    ← full astronomical calculation library
core.js                 ← global helpers + the initializePage() function
1-gcal-javascripts.js   ← Google Calendar integration
breakouts.js            ← mobile/responsive helpers
set-targetdate.js       ← manages the "target date" (which day is selected)
time-setting.js         ← clock, timezone, zodiac shade, dark mode
planet-orbits.js        ← planet animation engine  ← MUST be before calendar-scripts
login-scripts.js        ← Buwana auth, plan tracking, session management
item-management.js      ← to-do/event/journal CRUD and modal forms
calendar-scripts.js     ← year navigation and day path ID management
```

The order is not arbitrary. The most important constraint is that **`planet-orbits.js` must load before `calendar-scripts.js`**, because calendar refresh calls `animatePlanets()`, which is only defined after `planet-orbits.js` has run.

After all the sequential scripts, `dark-mode-toggle.mjs.js` is loaded as an ES module (separately, because it uses `import`/`export`). Finally, `initializePage()` — defined inside `core.js` — is called to start the actual UI.

---

## Authentication

EarthCal uses **Buwana** as its identity provider. Buwana is an OIDC/OAuth 2.0 service at `buwana.ecobricks.org` that handles account creation, login, and token issuance.

When a user logs in, auth tokens end up in browser storage:

- `sessionStorage.buwana_user` — the full JSON user payload for the session
- `localStorage.id_token` and `localStorage.access_token` — persisted tokens for returning visits
- `localStorage.user_profile` — cached profile data

Three global helpers let any script check auth state:

```js
window.isLoggedIn()    // true/false
getCurrentUser()       // returns the user object (buwana_id, name, time_zone, language)
window.user_plan       // 'padwan' (free), 'jedi', or 'master' (premium tiers)
```

All of these are set up by `login-scripts.js`.

---

## The Data Model

Users create and manage **items**. There are five item types:

- **To-Do** — a task, optionally dated
- **Event** — a dated occurrence attached to a calendar
- **Journal** — a personal note linked to a date
- **Record** — a recorded observation or log entry
- **DateCycle** — a cycle that appears on the circular calendar itself (the primary item type for the calendar view)

Every item has a standard set of fields: `item_id`, `buwana_id`, `calendar_id`, `title`, `date`, `year`, `month`, `day`, `time`, `time_zone`, `color_hex`, `emoji`, `pinned`, `frequency`, `all_day`, and `description`.

Items belong to **calendars**. Each user has at least one personal calendar ("My Calendar") and can create more. They can also subscribe to **public calendars** (shared community calendars). Each calendar has a `calendar_id`, `name`, `color`, `emoji`, and `tzid` (timezone).

EarthCal also supports **iCal import and export** via `connect_ical.php`, `sync_ical.php`, and `export_user_ics.php`.

---

## User Preferences

Several user choices are persisted in `localStorage`. These are read at startup and applied to the UI:

| Key | What it controls |
|---|---|
| `user_dark_mode` | Dark or light theme |
| `user_clock` | Whether the clock is shown |
| `user_animations` | Whether planet animations are enabled |
| `user_zodiac_positions` | Whether the zodiac ring is shown |
| `user_lunar_calendar` | Whether lunar months are highlighted |
| `user_comet_tracking` | Whether the 3I/ATLAS comet tracker is active |
| `zodiac_shade_setting` | Opacity of the zodiac ring (-100 to +100) |
| `user_timezone` | The user's selected timezone |
| `user_language` | The user's preferred language |

---

## The SVG Calendar — How It Works

This is the heart of EarthCal and the most unusual part of the codebase for developers coming from a typical web app background.

### The SVG Is a Live DOM

The calendar visualization is a single SVG file (`cals/earthcal-v1-2-2.svg`, about 1.5 MB). Rather than using it as an `<img>` tag, `earthcal-init.js` fetches it and **injects the full SVG markup inline** into `<div id="the-cal">`. This means every ring, arc, planet group, and path element in the SVG is a real DOM node. JavaScript can read from them and write to them directly — no Canvas API, no WebGL, just SVG attributes.

### The Rings (From Center Outward)

The calendar is structured as concentric rings:

1. **Center** — The sun (`#sol`), which provides the pivot point for all planet rotations
2. **Inner ring** — 365 (or 366) day arc segments and marker dots, one per day of the year
3. **Lunar ring** — 13 lunar month arcs
4. **Zodiac ring** — 12 zodiac sign segments
5. **Planetary ring** — Orbit paths and moveable planet groups
6. **Outer ring** — Animal migration cycle overlays (cariboo, goose, humming, monarch, whale)

### Day Paths and Event Highlighting

Each day of the year is represented by **two SVG paths**:

- A **day arc** (`-day` suffix) — the clickable curved segment for that day
- A **day marker** (`-day-marker` suffix) — a small dot that receives event highlight styling

Their IDs follow this pattern:

```
{dayOfYear}-{dayOfMonth}-{month}-{year}-day
{dayOfYear}-{dayOfMonth}-{month}-{year}-day-marker
```

For example, February 1, 2026 (the 32nd day of the year) would be:
```
32-1-2-2026-day
32-1-2-2026-day-marker
```

**These IDs are not static.** Every time the user navigates to a different year, `updateDayIds(year)` in `calendar-scripts.js` rewrites every single day path ID to reflect the new year's date mapping. This is because the day-of-year position stays fixed on the ring, but the actual calendar date it represents changes (different months start on different days, leap years add day 366, etc.).

When a user has events saved, `highlightDateCycles(targetDate)` connects that data back to the SVG. It works like this:

1. Clears all existing event highlights from the SVG
2. Loads all user items from the local cache
3. Filters to only items on active (visible) calendars
4. For each item, queries the SVG for paths whose ID contains the item's date string — either an exact date for one-time events, or a month/day match (no year) for annual recurring events
5. On each matching `-day-marker` path, it adds a `date_event` CSS class, sets a `--datecycle-highlight-color` custom property, and attaches tooltip data attributes
6. Separately, it populates the `#pinned-datecycles` and `#current-datecycles` side panels with the event details for the currently selected target date

This function re-runs whenever: the app first loads, the year changes, the target date changes, or the sync status changes (so items in an offline/pending state also appear correctly).

### Lunar Months

Lunar month arcs use IDs like `1-lunarmonth-12`, `7-lunarmonth-12`, and so on. The `1-lunar-scripts.js` file calculates which lunar month the target date falls in, highlights the corresponding arc, and rotates the entire `#lunar_months-12` group to align it correctly for the year:

```js
lunarMonths.setAttribute("transform", `rotate(${degrees}, ${centerX}, ${centerY})`);
```

It also calculates Hijri (Islamic calendar) month names and can overlay them on the lunar ring.

### Planet Animation

Planet groups in the SVG (`#mercury`, `#venus`, `#earth`, `#mars`, `#jupiter`, `#saturn`, `#uranus`, `#neptune`) each sit at a baked-in position representing **January 1, 2026**. This is the **epoch** — the reference date from which all planet angles are calculated.

When `planet-orbits.js` loads, it reads the existing `transform` attribute of each planet group and caches that angle as `element.dataset.ecEpochAngle`. From then on, any target date can be translated into a rotation angle using basic orbital math:

```
angle = epochAngle + direction × (daysSinceEpoch / orbitDays) × 360
```

The `PlanetGroupRotator` class handles one planet each. When `animatePlanets(startDate, targetDate)` is called, all planets interpolate from their start-date angle to their target-date angle over a duration that scales with the size of the jump (small jumps animate quickly, large jumps over years take a few seconds).

The animation itself uses vanilla `requestAnimationFrame` — not GSAP — with linear interpolation. GSAP is used elsewhere in the app (the whale migration marker, other UI effects) but the core planet orbit loop is kept simple and dependency-free.

One interesting detail: the **zodiac ring** must appear fixed in space even as Earth orbits. To achieve this, `#zodiacs` is attached to Earth's rotator with a counter-rotation: as Earth rotates clockwise by N degrees, the zodiacs group rotates counter-clockwise by N degrees, keeping it visually stationary.

### Animal Cycle Overlays

The five animal migration cycles (Cariboo, Goose, Humming, Monarch, Whale) are separate SVG files in `cycles/`. They're toggled on and off via `kin-cycles.js`. The whale cycle is the most dynamic — it uses GSAP's `MotionPathPlugin` to animate a marker (`#whale-marker`) along a curved path (`#whale-year-cycle`) that traces the whale's seasonal migration route.

---

## Key HTML Elements in dash.html

When reading or writing JavaScript that interacts with the calendar UI, these are the element IDs you'll encounter most:

| ID | What it is |
|---|---|
| `#the-cal` | The container where the SVG is injected on boot |
| `#current-year` | An SVG `<text>` element; the year number lives in its `tspan` child |
| `#prev-year`, `#next-year` | Year navigation buttons |
| `#pinned-datecycles` | Side panel listing pinned events for the selected date |
| `#current-datecycles` | Side panel listing regular events for the selected date |
| `#date-cycle-count-box` | Shows the count of events on the selected date |
| `#event-show-hide` | Button to show/hide the event panel |
| `#planet-buttons` | The palette of planet visibility toggle buttons |
| `#kin-buttons` | The palette of animal cycle toggle buttons |
| `#moon-phase`, `#moon-info` | Moon phase display and info panel |
| `#venus-phase`, `#mars-phase`, `#jupiter-phase`, `#saturn-phase` | Planet phase displays |
| `#whale-cycle`, `#whale-info` | Whale cycle display and data panel |
| `#offline-sync-indicator` | Shows the sync status (pending items, errors) |
| `#loading-spinner` | The spinner shown during initial boot |
| `#form-modal-message` | The modal for adding or editing items |
| `#add-datecycle` | The modal specifically for creating a DateCycle |

---

## Key Global Functions

Because there's no framework managing state, EarthCal relies on a set of global functions and variables that any script can call. Here's a quick reference:

| Symbol | File | What it does |
|---|---|---|
| `initializePage()` | `core.js` | Called once after all scripts load; starts the full UI |
| `window.animatePlanets(startDate, targetDate)` | `planet-orbits.js` | Animates all planets between two dates |
| `window.initPlanetAnimator()` | `planet-orbits.js` | Builds and caches the `animatePlanets` function |
| `window.syncStore` | `sync-store.js` | The offline-first data engine (see the offline/online wiki page) |
| `window.isLoggedIn()` | `login-scripts.js` | Returns true if the user has a valid session |
| `getCurrentUser()` | `login-scripts.js` | Returns the current user object |
| `window.user_plan` | `login-scripts.js` | The user's subscription tier string |
| `targetDate` | `set-targetdate.js` | The currently selected date (a global `Date` object) |
| `startDate` | `calendar-scripts.js` | The animation start date (a global `Date` object) |
| `highlightDateCycles(targetDate)` | `1-event-management.js` | Re-renders all event highlights on the SVG |
| `calendarRefresh()` | `calendar-scripts.js` | Full calendar refresh after a year change |
| `updateDayIds(year)` | `calendar-scripts.js` | Rewrites all SVG day path IDs for the given year |
| `getApiBase()` | `core.js` | Returns the correct API base URL for the current environment |

---

## Things to Watch Out For

A few non-obvious patterns that trip up new contributors:

**Script load order is fixed.** The sequence in `earthcal-init.js` is intentional. `planet-orbits.js` must load before `calendar-scripts.js` because `calendarRefresh()` calls `animatePlanets()`. `sync-store.js` must load before `core.js` because core expects `window.syncStore` to exist. Don't reorder without tracing the dependency chain.

**SVG day path IDs change every year.** When the user navigates to a different year, `updateDayIds(year)` rewrites every day path's `id` attribute. Any code that stores or caches a day path ID (e.g. `document.getElementById(...)`) will get a stale reference after a year change. Always query fresh.

**The planet epoch is January 1, 2026.** The SVG bakes in planet positions for that date. When you open the SVG in a viewer, that's the sky you're looking at. `planet-orbits.js` reads those initial positions once on load. If the SVG is ever regenerated with different planet positions, the epoch date in `planet-orbits.js` must be updated to match.

**Don't use `navigator.onLine` for connectivity decisions.** It's unreliable in Electron and in some network environments. Instead, use `syncStore.getStatus()` or subscribe via `syncStore.onOnlineStatusChange()`, both of which use a real HTTP probe to check whether the backend is actually reachable.

**Leap year day 366 is a special case.** In non-leap years, the 366th day arc path keeps a bare ID of `366-day` / `366-day-marker` without any date components. `updateDayIds` handles this explicitly.

**The zodiac ring counter-rotates.** It looks stationary, but it's actually being actively counter-rotated. The `#zodiacs` group is wired to Earth's `PlanetGroupRotator` via the `counterRotateId` option. Every time Earth's angle is set, zodiacs get `-angleDeg` applied. If you see zodiac rendering behaving unexpectedly after touching `planet-orbits.js`, this is usually why.
