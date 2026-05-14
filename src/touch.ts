import type { Point } from './chart';

export function distanceToPolyline(touch: Point, points: Point[]): number {
    let minDist = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
        const d = pointToSegmentDistance(touch, points[i], points[i + 1]);
        if (d < minDist) minDist = d;
    }

    return minDist;
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = a.x + t * dx;
    const projY = a.y + t * dy;

    return Math.hypot(p.x - projX, p.y - projY);
}

export function describePosition(touch: Point, canvasW: number, canvasH: number, proximity: number): string {
    const col = touch.x < canvasW / 3 ? 'left' : touch.x < (canvasW * 2) / 3 ? 'center' : 'right';
    const row = touch.y < canvasH / 3 ? 'top' : touch.y < (canvasH * 2) / 3 ? 'middle' : 'bottom';
    const onLine = proximity < 0.3 ? 'on the line' : proximity < 1 ? 'near the line' : 'away from line';
    return `${row}-${col}, ${onLine}`;
}
