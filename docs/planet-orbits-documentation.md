# Planet Orbits & Zodiac Animation — Technical Documentation

**File:** `js/planet-orbits.js`
**Last updated:** March 2026

---

## Overview

EarthCal displays the eight planets of the solar system as SVG groups that orbit visually around the sun (`#sol`) at the centre of the circular calendar. When a user selects a new target date, all planets animate smoothly from their start-date positions to their target-date positions. The zodiac ring (`#zodiacs`) counter-rotates opposite to Earth so that the zodiac signs appear fixed in space (as they should be), not spinning with the planet groups.

---

## The SVG Structure

The calendar SVG (`cals/earthcal-v1-2-2.svg`) contains eight planet groups, each with a pre-baked `transform` attribute encoding their position as of the **SVG epoch: January 1, 2026**:

```
#mercury, #venus, #earth, #mars, #jupiter, #saturn, #uranus, #neptune
```

Each group is nested inside `#solar-system-center`. The sun circle is `#sol`, and its `cx`/`cy` attributes provide the exact pixel coordinates of the orbital centre — the pivot point for all rotations.

The zodiac ring is a separate group `#zodiacs` that sits on the same layer. In the SVG it has a pre-baked `matrix(...)` transform that positions and rotates it correctly for the epoch date. As Earth animates forward or backward in time, the zodiac ring must be counter-rotated by an equal and opposite angle so it appears stationary relative to the sky.

---

## How the Animation Works

### 1. Epoch Angle Caching

When `PlanetGroupRotator` is constructed for a planet, it reads the `transform` attribute already in the SVG (the epoch position) and stores it in `element.dataset.ecEpochAngle`. This read happens only once. From this point on, the SVG transform attribute is overwritten every animation frame — the cached epoch angle is the stable reference point.

### 2. Angle Calculation

For any given date, the planet's angle is:

```
angle = epochAngle + direction × (daysSinceEpoch / orbitDays) × 360
```

Where `daysSinceEpoch` is calculated in **UTC midnight arithmetic** (DST-safe — no risk of fractional days from daylight saving transitions).

**Orbital periods used:**

| Planet  | Days     |
|---------|----------|
| Mercury | 88       |
| Venus   | 224.7    |
| Earth   | 365.256  |
| Mars    | 686.98   |
| Jupiter | 4332.59  |
| Saturn  | 10759    |
| Uranus  | 30687    |
| Neptune | 60190    |

### 3. Angle Unwrapping (Direction Preservation)

Because angles are modular (0–360 repeating), a naive interpolation between start and end angles can produce a "wrong way" rotation — e.g., a planet swinging backwards 350° instead of forwards 10°. `unwrapAngleBySign()` resolves this by adjusting the target angle in multiples of 360° until it is on the correct side of the start angle, matching the direction of the time jump (forward or backward).

### 4. Animation Loop

`animatePlanets(startDate, targetDate)` uses a vanilla `requestAnimationFrame` loop — **not GSAP**. The animation duration scales with the size of the date jump (0.5s for <30 days up to 4s for multi-year jumps). A **two-frame init** pattern is used: all planets are snapped to the start pose on frame 0, then the interpolation loop begins on frame 1. This prevents the "backstep" artifact where planets briefly jump to the wrong position before animating.

An `animToken` integer guards against race conditions — if a new `animatePlanets()` call arrives mid-animation, the old loop detects the stale token and exits cleanly.

### 5. Per-Planet FPS Throttling

Inner planets (Mercury, Venus, Earth) animate at full frame rate. Outer planets use `minFrameMs` throttling — Mars at ~60fps, Jupiter at ~20fps, Saturn/Uranus/Neptune at 6–8fps. Outer planets move so slowly that smooth animation is imperceptible; throttling saves CPU.

---

## Zodiac Counter-Rotation

### The Goal

The zodiac signs (`#zodiacs`) must appear **fixed in space** — i.e., Aries always points to the vernal equinox regardless of what date is displayed. Since all planet groups (including `#earth`) rotate around the sun, a naive rotation would spin the zodiacs with the calendar rings. Counter-rotation cancels this.

### How It Is Linked

`#earth`'s `PlanetGroupRotator` is constructed with:
```js
counterRotateId: "zodiacs",
counterPivot: pivot   // ← the sun centre coordinates from #sol
```

Every time Earth's angle is set (each animation frame), `applyCounterRotation()` fires automatically.

### The Counter-Rotation Calculation

The rotation applied to `#zodiacs` is the **negative delta from the epoch angle**:

```
delta = earthAngleDeg − earthEpochAngle
counterRotation = −delta   (around the sun centre)
```

This means: at the epoch date (Jan 1, 2026), delta = 0 and no counter-rotation is applied — the zodiacs sit exactly where the SVG placed them. As Earth moves forward, the counter-rotation grows equal and opposite so the zodiac ring stays visually fixed.

The counter-rotation is composed with the zodiacs' **original SVG base transform** (its epoch matrix) so that the built-in positioning of the zodiac ring is preserved. The composition is: `rotationMatrix × baseMatrix`.

---

## Problems Faced & Solutions

### Problem 1 — Zodiac Misalignment (Phase Offset)

**Symptom:** The zodiac ring appeared correctly positioned at the epoch date but drifted noticeably when navigating to other dates. At some dates it was visually shifted by 10–20°.

**Root cause:** The counter-rotation was being applied as an absolute angle (`−earthAngleDeg`) rather than as a delta from the epoch. This meant the counter-rotation overcorrected — it was undoing not just the animation rotation but also the built-in offset between the SVG's epoch pose and true north.

**Fix:** Changed the counter-rotation to subtract only the delta from the epoch angle, then compose that rotation matrix with the zodiac's original base transform from the SVG.

---

### Problem 2 — `getBBox()` Timing Race (Chrome & Firefox)

**Symptom:** The zodiac pivot point was being resolved from `getBBox()` on the `#zodiacs` element. On first load, `getBBox()` returned `{width: 0, height: 0}` because the SVG was not yet fully laid out — the element was hidden (`display:none`) or the layout pass hadn't completed. This caused the pivot to remain unresolved (null), falling back to `{x: 0, y: 0}`, which produced a completely wrong rotation origin.

**Fix:** Replaced the `getBBox()` pivot resolution with `counterPivot: pivot` set at construction time — the sun centre coordinates read directly from `#sol`'s `cx`/`cy` attributes. These are available immediately as soon as the SVG is in the DOM. The `resolveCounterPivot()` method is still present in the class for potential future use but is no longer called for the zodiacs.

---

### Problem 3 — `DOMMatrix` SVG vs CSS String Format (Firefox & Chrome crash)

**Symptom:** After the zodiac alignment fix was deployed, the planet animation **stopped working entirely** on both Firefox and Chrome, throwing:

```
DOMException: An invalid or illegal string was specified
    at applyCounterRotation (planet-orbits.js:163)
    at forceAngle (planet-orbits.js:139)
    at animatePlanets (planet-orbits.js:235)
```

The error occurred on the very first animation call and crashed the entire `animatePlanets()` execution path.

**Root cause:** The fix for Problem 1 introduced a call to `new DOMMatrix(baseStr)` where `baseStr` was the raw `transform` attribute string from the SVG. The `#zodiacs` element's transform in the SVG is:

```
matrix(.70022 .65133 -.65133 .70022 164.13 -84.579)
```

This is **SVG syntax** — values are space-separated. The `DOMMatrix` string constructor expects **CSS transform syntax**, where `matrix()` values are comma-separated. Passing a space-separated string is valid in SVG but invalid in CSS, causing the DOMException in both Firefox and Chrome.

**Fix:** Added a `parseSvgTransform(str)` helper function that:
1. Detects `matrix(a b c d e f)` (space-separated SVG format), extracts the six values, and passes them as a **numeric array** to `new DOMMatrix([a, b, c, d, e, f])` — bypassing the string parser entirely.
2. Detects `rotate(angle cx cy)` (3-argument SVG form, not valid in CSS) and manually converts it to a rotation matrix.
3. Falls back to a direct `new DOMMatrix(str)` try/catch for CSS-already-formatted strings.

This function now handles all SVG transform strings safely and cross-browser.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| `requestAnimationFrame` loop, not GSAP | GSAP is used for the whale marker path animation elsewhere; keeping planet rotation as a plain rAF loop avoids a GSAP dependency for a simple linear interpolation. |
| Epoch angle read once from SVG, never recalculated | The SVG encodes planet positions for Jan 1, 2026 — treating this as the ground truth epoch avoids floating-point drift from repeated incremental angle math. |
| Counter-pivot = sun centre, not `getBBox()` | `getBBox()` is unreliable before the SVG is fully rendered and laid out. The sun centre from `#sol.cx/cy` is always available as soon as the SVG enters the DOM. |
| `animToken` cancellation guard | Prevents ghost animation loops from old `animatePlanets()` calls if the user selects dates rapidly. |
| UTC midnight arithmetic for day counting | Avoids DST-related fractional days that cause slight positional errors at DST transition dates in the user's local timezone. |

---

## Entry Points

| Symbol | Purpose |
|---|---|
| `window.initPlanetAnimator()` | Called once from `core.js` after all scripts load. Builds and returns `animatePlanets`. |
| `window.animatePlanets(startDate, targetDate)` | Animates all planets from `startDate` position to `targetDate` position. Both arguments must be `Date` objects. |

`animatePlanets` is called by `calendarRefresh()` in `core.js` / `calendar-scripts.js` whenever the user selects a new date or changes the year.
