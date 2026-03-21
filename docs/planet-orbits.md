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

`animatePlanets(startDate, targetDate)` uses a vanilla `requestAnimationFrame` loop — **not GSAP**. The animation duration scales with the size of the date jump (0.5s for <30 days up to 4s for multi-year jumps).

The start angle `a0` for each planet is read **directly from the planet element's current `transform` attribute** using `parseRotateDegrees()`. It is **not** computed from `startDate`. This is critical: if `a0` were calculated from `startDate` instead, calling `animatePlanets()` while a previous animation is still running mid-way would snap all planets to the `startDate` position before the new animation begins — visible as a brief backward jump. By reading the live DOM transform, `a0` always equals the planet's actual current visual angle, and no snap occurs.

**Counter-rotation pre-sync:** Before starting the rAF loop, `animatePlanets` calls `p.applyCounterRotation(a0)` for any planet that has a `counterEl` (i.e., Earth → zodiacs). This ensures the zodiac ring is snapped to the correct position for `a0` at the moment the new animation begins — without snapping the planet itself. Without this explicit call, the zodiac could remain frozen at the epoch/base position if no previous animation had run (e.g., on first navigation with zodiacs visible, or after a visibility toggle).

**`t0` first-frame latch:** The animation timer `t0` is set to `-1` before the rAF loop and latched to `now` on the **first callback frame** (`if (t0 < 0) t0 = now`). This ensures `t = 0` on the very first tick. If `t0` were captured synchronously before the rAF call, the browser's rAF scheduling delay (~16 ms) would mean the first frame already has `t > 0`, producing a perceptible initial jump proportional to `16ms / duration`.

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

### Problem 4 — Backward Snap on Interrupted Animations (and two-frame init overhead)

**Symptom:** When clicking a new date on the calendar while a planet animation was still running, all planets briefly snapped backward before animating forward to the correct target position.

**Root cause:** `animatePlanets()` computed `a0` (the animation start angle) from `startDate` using `p.angleAt(startDate, epochDate)`, then called `forceAngle(a0)` to snap every planet to that position before starting the new animation. `startDate` is the *previous* `targetDate` — the position the planets were heading *to*, not where they currently *are*. When a previous animation was interrupted mid-way (the common case when users click rapidly), the planets were at some intermediate visual position. `forceAngle(a0)` snapped them back to `startDate`'s angle, which could be behind the current position — producing a visible backward jump.

The earlier "two-frame init" pattern was intended to address a related backstep artifact but did not fix this specific case: the snap itself happened before any frame was drawn, so spacing the interpolation across two frames made no difference.

**Fix:** Changed `a0` to be read from the planet element's live `transform` attribute via `parseRotateDegrees(p.el.getAttribute("transform"))` rather than computed from `startDate`. Since `a0` now equals the planet's actual current visual angle, the `forceAngle(a0)` call is no longer needed and was removed. The interpolation now always starts smoothly from wherever the planet currently is, regardless of whether a previous animation was running.

The two-frame init (outer rAF captured `t0`, inner rAF started the tick) also became unnecessary once `forceAngle(a0)` was removed. It was collapsed to a single-frame init where `t0` is latched inside the first rAF callback, eliminating both the ~32 ms dead pause and the first-frame jump described in Problem 6.

---

### Problem 5 — `set2Yesterday()` Spins Planets a Full Orbit

**Symptom:** Clicking the "previous day" button caused all planets to rapidly spin almost a full orbit forward instead of stepping back one day. `set2Tomorrow()` worked correctly.

**Root cause:** The day-path click handler does `startDate = targetDate` after `calendarRefresh()`, making both variables reference the **same Date object**. `set2Yesterday()` then calls `targetDate.setDate(getDate() - 1)`, which mutates the shared object — so **both `startDate` and `targetDate` silently become yesterday**. When `animatePlanets(yesterday, yesterday)` is called, `dayJump = 0` and `jumpSign` defaults to `+1` (forward). With the new code reading `a0` from the live DOM (today's angle) and `a1 = angleAt(yesterday)` being slightly *less* than `a0`, `unwrapAngleBySign` with `desiredSign = +1` keeps adding 360° until `a1 ≥ a0`, causing a near-full-orbit forward spin.

`set2Tomorrow()` only avoided the same fate by coincidence: tomorrow's angle is already larger than today's, so the `+1` unwrap needed no adjustment and the 1-day forward step happened to be correct.

**Fix:** Both `set2Yesterday()` and `set2Tomorrow()` now snapshot `startDate` as a **new Date object** (`startDate = new Date(targetDate)`) *before* mutating `targetDate`. This ensures `dayJump = ±1` and the correct `jumpSign`, so `unwrapAngleBySign` wraps in the right direction for a clean one-day step.

**Key lesson:** Never mutate `targetDate` in place without first copying it to `startDate` as a new object. Because the click handler aliases `startDate = targetDate`, any in-place mutation of `targetDate` invisibly changes `startDate` too, collapsing the date range to zero and breaking direction detection.

---

### Problem 6 — Miniscule Snap at Animation Start (t0 Timing)

**Symptom:** A very small but perceptible forward jump occurred at the very beginning of every planet animation — planets appeared to leap slightly from `a0` before settling into smooth interpolation.

**Root cause:** `t0` (the animation start timestamp) was captured synchronously with `const t0 = performance.now()` before the `requestAnimationFrame` call. The browser schedules the first rAF callback ~16 ms later. On that first frame, `t = (now - t0) / duration` was already `≈ 16/duration` — nonzero — so the interpolation began partway through. With a 500 ms animation, the first tick immediately jumped to `t ≈ 0.032`, which is perceptible as a snap.

**Fix:** Changed to a first-frame latch: `let t0 = -1` before the rAF loop, then `if (t0 < 0) t0 = now` as the first line inside the callback. `t` is exactly `0` on the first frame, and the animation begins from precisely `a0` with no initial jump.

---

### Problem 7 — Zodiac Not Counter-Rotating on First Animation

**Symptom:** With "View zodiac positions" enabled, the `#zodiacs` group remained frozen at the epoch/base SVG position when navigating to a non-epoch date. It did not counter-rotate to track Earth's orbit.

**Root cause:** `applyCounterRotation()` is only invoked inside `setAngle()` and `forceAngle()`. After the fix for Problem 4 removed the `forceAngle(a0)` setup loop, there was no longer any synchronous call to establish the zodiac's counter-rotation at animation start. If `animatePlanets` was called for the first time (or after a visibility toggle that reset state), the first rAF tick might be delayed long enough that a user could see the zodiac at the wrong position. More critically, if the previous animation had been cancelled or had never run, `applyCounterRotation` was never called at all, leaving zodiacs stuck at the SVG base position.

**Fix:** Added a pre-animation loop before the `animToken` assignment that explicitly calls `p.applyCounterRotation(a0)` for any planet that has `p.counterEl` set (currently only Earth):

```js
// Sync counter-rotation elements immediately — without snapping planets.
for (const { p, a0 } of plan) {
    if (p.counterEl) p.applyCounterRotation(a0);
}
```

This call sets the zodiac to its correct counter-rotated position for the current Earth angle (`a0`) synchronously, before the first rAF tick. The planet itself is not moved — no `forceAngle` is called.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| `requestAnimationFrame` loop, not GSAP | GSAP is used for the whale marker path animation elsewhere; keeping planet rotation as a plain rAF loop avoids a GSAP dependency for a simple linear interpolation. |
| Epoch angle read once from SVG, never recalculated | The SVG encodes planet positions for Jan 1, 2026 — treating this as the ground truth epoch avoids floating-point drift from repeated incremental angle math. |
| Counter-pivot = sun centre, not `getBBox()` | `getBBox()` is unreliable before the SVG is fully rendered and laid out. The sun centre from `#sol.cx/cy` is always available as soon as the SVG enters the DOM. |
| `animToken` cancellation guard | Prevents ghost animation loops from old `animatePlanets()` calls if the user selects dates rapidly. |
| UTC midnight arithmetic for day counting | Avoids DST-related fractional days that cause slight positional errors at DST transition dates in the user's local timezone. |
| Counter-rotation pre-sync before rAF loop | `applyCounterRotation(a0)` is called synchronously for Earth before starting the animation loop. This guarantees the zodiac is correctly positioned from frame 0, even when no previous animation has run. |
| `t0` latched on first rAF frame, not before | Capturing `t0 = now` inside the first callback rather than before `requestAnimationFrame` ensures `t = 0` on the first tick, eliminating the ~16 ms initial jump that would otherwise occur due to rAF scheduling delay. |

---

## Entry Points

| Symbol | Purpose |
|---|---|
| `window.initPlanetAnimator()` | Called once from `core.js` after all scripts load. Builds and returns `animatePlanets`. |
| `window.animatePlanets(startDate, targetDate)` | Animates all planets from `startDate` position to `targetDate` position. Both arguments must be `Date` objects. |

`animatePlanets` is called by `calendarRefresh()` in `core.js` / `calendar-scripts.js` whenever the user selects a new date or changes the year.
