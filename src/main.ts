import { datasets } from './data';
import { valuesToPoints, drawChart, getGridLines, type Point, type ChartState, type GridLine } from './chart';
import { vibrateForProximity, vibrateGridLine, stop as stopHaptics } from './haptics';
import { initAudio, resumeAudio, playForProximity, stopAudio } from './audio';
import { distanceToPolyline, describePosition } from './touch';
import { speak, cancelSpeech, primeSpeech, forcePrimeSpeech } from './speech';
import { loadSettings, saveSettings, type Settings } from './settings';

const hasVibration = 'vibrate' in navigator;
const settings: Settings = loadSettings();
if (!hasVibration) settings.haptic = false;

const THRESHOLD_PX = 35;
const GRID_DWELL_THRESHOLD_PX = 20;
const ARIA_INTERVAL_MS = 500;
const DWELL_MS = 500;
const DWELL_MOVE_TOLERANCE_PX = 4;

const canvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const ariaLive = document.getElementById('aria-live') as HTMLDivElement;
const toggleSound = document.getElementById('toggle-sound') as HTMLInputElement;
const toggleHaptic = document.getElementById('toggle-haptic') as HTMLInputElement;
const toggleScreenReader = document.getElementById('toggle-screenreader') as HTMLInputElement;
const initSpeechBtn = document.getElementById('init-speech') as HTMLButtonElement;

let currentDataset = 'sine';
let chartPoints: Point[] = [];
let currentGridLines: GridLine[] = [];
let touchPos: Point | null = null;
let prevTouchPos: Point | null = null;
let currentProximity = Infinity;
let lastAriaUpdate = 0;
let dwellTimer: number | null = null;
let dwellAnchor: Point | null = null;

function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    updateChart();
}

function updateChart(): void {
    const rect = canvas.getBoundingClientRect();
    const values = datasets[currentDataset].values;
    chartPoints = valuesToPoints(values, rect.width, rect.height);
    currentGridLines = getGridLines(rect.width, rect.height);
    render();
}

function nearestGridLine(pos: Point): { line: GridLine; dist: number } | null {
    let best: { line: GridLine; dist: number } | null = null;
    for (const line of currentGridLines) {
        const d = line.orientation === 'horizontal'
            ? Math.abs(pos.y - line.position)
            : Math.abs(pos.x - line.position);
        if (!best || d < best.dist) best = { line, dist: d };
    }
    return best;
}

function detectGridCrossing(prev: Point, next: Point): GridLine | null {
    for (const line of currentGridLines) {
        if (line.orientation === 'horizontal') {
            if ((prev.y - line.position) * (next.y - line.position) < 0) return line;
        } else {
            if ((prev.x - line.position) * (next.x - line.position) < 0) return line;
        }
    }
    return null;
}

function render(): void {
    const state: ChartState = {
        points: chartPoints,
        touchPos,
        proximity: Math.min(currentProximity, 1.5),
    };
    drawChart(ctx, state, THRESHOLD_PX);
}

function pixelToChartCoords(p: Point, w: number, h: number): { x: number; y: number } {
    return {
        x: Math.round((p.x / w) * 100),
        y: Math.round((1 - p.y / h) * 100),
    };
}

function speakCoordinates(): void {
    if (!touchPos || !settings.screenReader) return;
    const nearest = nearestGridLine(touchPos);
    if (nearest && nearest.dist < GRID_DWELL_THRESHOLD_PX) {
        speak(nearest.line.label);
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const { x, y } = pixelToChartCoords(touchPos, rect.width, rect.height);
    speak(`${x}, ${y}`);
}

function scheduleDwell(): void {
    if (!touchPos) return;
    if (dwellTimer !== null) window.clearTimeout(dwellTimer);
    dwellAnchor = { x: touchPos.x, y: touchPos.y };
    dwellTimer = window.setTimeout(() => {
        dwellTimer = null;
        speakCoordinates();
    }, DWELL_MS);
}

function maybeResetDwell(newPos: Point): void {
    if (!dwellAnchor) {
        scheduleDwell();
        return;
    }
    const dx = newPos.x - dwellAnchor.x;
    const dy = newPos.y - dwellAnchor.y;
    if (Math.hypot(dx, dy) > DWELL_MOVE_TOLERANCE_PX) {
        scheduleDwell();
    }
}

function clearDwell(): void {
    if (dwellTimer !== null) {
        window.clearTimeout(dwellTimer);
        dwellTimer = null;
    }
    dwellAnchor = null;
    cancelSpeech();
}

function updatePointer(clientX: number, clientY: number): void {
    const rect = canvas.getBoundingClientRect();
    const next: Point = { x: clientX - rect.left, y: clientY - rect.top };
    const pixelDist = distanceToPolyline(next, chartPoints);
    currentProximity = pixelDist / THRESHOLD_PX;
    if (hasVibration && settings.haptic) {
        vibrateForProximity(currentProximity);
        // Brief pulse when crossing a grid line, but only when not already in chart-line haptic feedback
        if (currentProximity >= 1 && touchPos) {
            const crossed = detectGridCrossing(touchPos, next);
            if (crossed) vibrateGridLine();
        }
    }
    prevTouchPos = touchPos;
    touchPos = next;
    if (settings.sound) playForProximity(currentProximity);
    maybeResetDwell(next);
    updateStatus();
    render();
}

function endPointer(): void {
    prevTouchPos = null;
    touchPos = null;
    currentProximity = Infinity;
    stopHaptics();
    stopAudio();
    clearDwell();
    statusEl.textContent = 'Touch the screen and explore the chart';
    render();
}

let activePointerId: number | null = null;

function handlePointerDown(e: PointerEvent): void {
    if (activePointerId !== null) return;
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    initAudio();
    resumeAudio();
    if (settings.screenReader) primeSpeech();
    updatePointer(e.clientX, e.clientY);
}

function handlePointerMove(e: PointerEvent): void {
    if (e.pointerId !== activePointerId) return;
    e.preventDefault();
    updatePointer(e.clientX, e.clientY);
}

function handlePointerEnd(e: PointerEvent): void {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    endPointer();
}

function updateStatus(): void {
    if (!touchPos) return;

    const rect = canvas.getBoundingClientRect();
    const distPx = (currentProximity * THRESHOLD_PX).toFixed(0);
    const onLine = currentProximity < 0.3 ? 'ON LINE' : currentProximity < 1 ? 'NEAR' : 'off';
    const { x, y } = pixelToChartCoords(touchPos, rect.width, rect.height);
    statusEl.textContent = `${onLine} | distance: ${distPx}px | (${x}, ${y})`;

    const now = Date.now();
    if (now - lastAriaUpdate > ARIA_INTERVAL_MS) {
        lastAriaUpdate = now;
        ariaLive.textContent = describePosition(touchPos, rect.width, rect.height, currentProximity);
    }
}

function updateCanvasAltTag(): void {
    canvas.setAttribute('aria-label', datasets[currentDataset].description);
}

datasetSelect.addEventListener('change', () => {
    currentDataset = datasetSelect.value;
    cancelSpeech();
    if (settings.screenReader) {
        speak(`${datasets[currentDataset].name || currentDataset} selected`);
    }
    updateCanvasAltTag();
    updateChart();
});

// Initialize toggle checkboxes from settings
toggleSound.checked = settings.sound;
toggleHaptic.checked = settings.haptic;
toggleHaptic.disabled = !hasVibration;
toggleScreenReader.checked = settings.screenReader;

toggleSound.addEventListener('change', () => {
    settings.sound = toggleSound.checked;
    saveSettings(settings);
    if (!settings.sound) stopAudio();
});

toggleHaptic.addEventListener('change', () => {
    settings.haptic = toggleHaptic.checked;
    saveSettings(settings);
    if (!settings.haptic) stopHaptics();
});

initSpeechBtn.addEventListener('click', () => {
    forcePrimeSpeech();
});

toggleScreenReader.addEventListener('change', () => {
    settings.screenReader = toggleScreenReader.checked;
    saveSettings(settings);
    if (settings.screenReader) {
        primeSpeech();
    } else {
        cancelSpeech();
        clearDwell();
    }
});

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerEnd);
canvas.addEventListener('pointercancel', handlePointerEnd);
canvas.addEventListener('pointerleave', (e) => {
    // For mouse: end on leave. For touch (with pointer capture), this won't fire mid-drag.
    if (e.pointerType === 'mouse' && e.pointerId === activePointerId) handlePointerEnd(e);
});

window.addEventListener('resize', resize);
updateCanvasAltTag();
resize();
