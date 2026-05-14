# Haptic Chart Explorer — Proof of Concept

## Context

Build a standalone web app that lets blind users "feel" a line chart by touching the screen. The chart is drawn normally. As the user moves their finger around the 2D canvas, the phone **vibrates when the finger is on (or near) the chart line**, and is silent when far from it. This mimics running a finger over a raised-line tactile graphic — the user discovers the chart's shape by searching for the vibration.

Android-only (uses the Web Vibration API; Safari does not support it).

## Architecture

Single-page app: **HTML + CSS + TypeScript**, bundled with Vite. No framework dependencies.

### Project location

`prototypes/haptic-chart/`

### Files to create

```
prototypes/haptic-chart/
├── package.json
├── tsconfig.json
├── vite.config.ts        # minimal — no framework plugin
├── index.html
└── src/
    ├── main.ts           # entry — bootstrap UI
    ├── chart.ts          # canvas rendering of the line chart
    ├── haptics.ts        # proximity-based vibration engine
    ├── touch.ts          # touchmove → (x,y) → distance to line → haptic
    └── data.ts           # sample datasets
```

## Core Interaction

1. A line chart is drawn on a full-screen `<canvas>`.
2. User touches anywhere on the screen and moves their finger freely in 2D.
3. On each `touchmove`, compute the **shortest distance from the touch point to the chart line**.
4. **If within threshold (~30px):** vibrate. Intensity scales with proximity — directly on the line = strong continuous buzz, edge of threshold = light ticking.
5. **If outside threshold:** no vibration (silence).
6. On `touchend`: stop vibration.

The user explores by sweeping their finger around until they feel the buzz, then follows it to trace the chart's shape.

## Core Design

### 1. Distance calculation (`touch.ts`)
- The chart line is a series of pixel-coordinate segments (polyline).
- On each touchmove, compute the perpendicular distance from the touch point to the nearest line segment.
- Normalize distance: 0 = exactly on line, 1 = at threshold edge, >1 = outside.
- This is a simple point-to-line-segment distance calculation, checked against each segment (fast enough for ~100-point charts at 60fps).

### 2. Haptic engine (`haptics.ts`)
- **Input:** normalized proximity (0 = on line, 1 = at threshold edge).
- **On line (distance ≈ 0):** continuous vibration `vibrate([50])`.
- **Near line (0 < distance < 1):** pulsing — duty cycle proportional to closeness. Closer = longer on, shorter off.
- **Off line (distance ≥ 1):** `vibrate(0)` — stop.
- Re-trigger pattern on each touchmove (throttled to ~30fps to avoid overloading the vibration motor).

### 3. Chart rendering (`chart.ts`)
- Draw line chart on `<canvas>` — white line on black background (high contrast).
- Draw a small circle at the current touch position.
- Draw a faint "proximity ring" around the touch point showing the threshold radius — helps sighted assistants understand what's happening.
- Store the line as an array of `{x, y}` pixel coordinates for distance lookups.

### 4. Sample data (`data.ts`)
- **Sine wave** — smooth, predictable; good for calibration.
- **Stock price** — realistic noisy data.
- **Step function** — abrupt vertical jumps.
- Switcher UI at top of screen.

### 5. Accessibility
- `aria-live="polite"` region announces approximate position ("top-left", "middle-right") and whether on/near/off the line, updated every ~500ms while touching.
- Instructions text for screen readers at page load.
- Full-screen touch target.

## Verification

1. `cd prototypes/haptic-chart && npm install && npm run dev`
2. Open on an **Android phone** in Chrome.
3. Touch and drag around the screen:
   - Feel vibration when finger crosses the chart line.
   - Vibration fades as finger moves away from line.
   - No vibration when far from any part of the line.
4. Try tracing the full chart shape by following the vibration.
5. Switch datasets and verify distinct shapes are perceivable.
6. `npm run typecheck` passes.
