export interface Point {
    x: number;
    y: number;
}

export interface ChartState {
    points: Point[];
    touchPos: Point | null;
    proximity: number;
}

const PADDING = { top: 20, right: 20, bottom: 20, left: 20 };

export function valuesToPoints(values: number[], width: number, height: number): Point[] {
    const plotW = width - PADDING.left - PADDING.right;
    const plotH = height - PADDING.top - PADDING.bottom;

    return values.map((v, i) => ({
        x: PADDING.left + (i / (values.length - 1)) * plotW,
        y: PADDING.top + (1 - v) * plotH,
    }));
}

export function drawChart(ctx: CanvasRenderingContext2D, state: ChartState, threshold: number): void {
    const { width, height } = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const { points, touchPos, proximity } = state;
    if (points.length < 2) return;

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i <= 4; i++) {
        const y = PADDING.top * dpr + (i / 4) * (height - (PADDING.top + PADDING.bottom) * dpr);
        ctx.beginPath();
        ctx.moveTo(PADDING.left * dpr, y);
        ctx.lineTo(width - PADDING.right * dpr, y);
        ctx.stroke();
    }

    // Draw the chart line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x * dpr, points[0].y * dpr);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * dpr, points[i].y * dpr);
    }
    ctx.stroke();

    if (touchPos) {
        // Draw proximity ring
        const ringRadius = threshold * dpr;
        ctx.strokeStyle = proximity < 1
            ? `rgba(0, 144, 255, ${0.3 + 0.4 * (1 - proximity)})`
            : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(touchPos.x * dpr, touchPos.y * dpr, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw touch point
        const dotColor = proximity < 1
            ? `rgb(0, ${Math.round(144 + 111 * (1 - proximity))}, 255)`
            : '#666';
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(touchPos.x * dpr, touchPos.y * dpr, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Draw nearest point on line indicator when close
        if (proximity < 1) {
            const nearest = findNearestPointOnLine(touchPos, state.points);
            ctx.fillStyle = '#0f0';
            ctx.beginPath();
            ctx.arc(nearest.x * dpr, nearest.y * dpr, 4 * dpr, 0, Math.PI * 2);
            ctx.fill();

            // Draw connecting line from touch to nearest point
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 1 * dpr;
            ctx.setLineDash([4 * dpr, 4 * dpr]);
            ctx.beginPath();
            ctx.moveTo(touchPos.x * dpr, touchPos.y * dpr);
            ctx.lineTo(nearest.x * dpr, nearest.y * dpr);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function findNearestPointOnLine(touch: Point, points: Point[]): Point {
    let nearest = points[0];
    let minDist = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
        const p = closestPointOnSegment(touch, points[i], points[i + 1]);
        const d = dist(touch, p);
        if (d < minDist) {
            minDist = d;
            nearest = p;
        }
    }

    return nearest;
}

function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return a;

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    return { x: a.x + t * dx, y: a.y + t * dy };
}

function dist(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
