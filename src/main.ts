import { datasets } from './data';
import { valuesToPoints, drawChart, type Point, type ChartState } from './chart';
import { vibrateForProximity, stop as stopHaptics } from './haptics';
import { initAudio, resumeAudio, playForProximity, stopAudio } from './audio';
import { distanceToPolyline, describePosition } from './touch';

const hasVibration = 'vibrate' in navigator;

const THRESHOLD_PX = 35;
const ARIA_INTERVAL_MS = 500;

const canvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const ariaLive = document.getElementById('aria-live') as HTMLDivElement;

let currentDataset = 'sine';
let chartPoints: Point[] = [];
let touchPos: Point | null = null;
let currentProximity = Infinity;
let lastAriaUpdate = 0;

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
    render();
}

function render(): void {
    const state: ChartState = {
        points: chartPoints,
        touchPos,
        proximity: Math.min(currentProximity, 1.5),
    };
    drawChart(ctx, state, THRESHOLD_PX);
}

function handleTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    initAudio();
    resumeAudio();

    const rect = canvas.getBoundingClientRect();
    touchPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
    };

    const pixelDist = distanceToPolyline(touchPos, chartPoints);
    currentProximity = pixelDist / THRESHOLD_PX;

    if (hasVibration) vibrateForProximity(currentProximity);
    playForProximity(currentProximity);
    updateStatus();
    render();
}

function handleTouchEnd(): void {
    touchPos = null;
    currentProximity = Infinity;
    stopHaptics();
    stopAudio();
    statusEl.textContent = 'Touch the screen and explore the chart';
    render();
}

function updateStatus(): void {
    if (!touchPos) return;

    const rect = canvas.getBoundingClientRect();
    const distPx = (currentProximity * THRESHOLD_PX).toFixed(0);
    const onLine = currentProximity < 0.3 ? 'ON LINE' : currentProximity < 1 ? 'NEAR' : 'off';
    statusEl.textContent = `${onLine} | distance: ${distPx}px | threshold: ${THRESHOLD_PX}px`;

    const now = Date.now();
    if (now - lastAriaUpdate > ARIA_INTERVAL_MS) {
        lastAriaUpdate = now;
        ariaLive.textContent = describePosition(touchPos, rect.width, rect.height, currentProximity);
    }
}

datasetSelect.addEventListener('change', () => {
    currentDataset = datasetSelect.value;
    updateChart();
});

canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchcancel', handleTouchEnd);

// Mouse support for desktop testing (audio feedback)
canvas.addEventListener('mousedown', (e) => {
    initAudio();
    resumeAudio();
    const rect = canvas.getBoundingClientRect();
    touchPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const pixelDist = distanceToPolyline(touchPos, chartPoints);
    currentProximity = pixelDist / THRESHOLD_PX;
    playForProximity(currentProximity);
    updateStatus();
    render();
});
canvas.addEventListener('mousemove', (e) => {
    if (e.buttons === 0) return;
    const rect = canvas.getBoundingClientRect();
    touchPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const pixelDist = distanceToPolyline(touchPos, chartPoints);
    currentProximity = pixelDist / THRESHOLD_PX;
    playForProximity(currentProximity);
    updateStatus();
    render();
});
canvas.addEventListener('mouseup', () => {
    touchPos = null;
    currentProximity = Infinity;
    stopAudio();
    statusEl.textContent = 'Touch the screen and explore the chart';
    render();
});

window.addEventListener('resize', resize);
resize();
