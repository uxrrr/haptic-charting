export interface Dataset {
    name: string;
    values: number[];
}

function generateSine(points: number): number[] {
    const values: number[] = [];
    for (let i = 0; i < points; i++) {
        const t = i / (points - 1);
        values.push(0.5 + 0.4 * Math.sin(t * Math.PI * 4));
    }
    return values;
}

function generateStock(points: number): number[] {
    const values: number[] = [];
    let price = 0.5;
    for (let i = 0; i < points; i++) {
        price += (Math.random() - 0.48) * 0.04;
        price = Math.max(0.05, Math.min(0.95, price));
        values.push(price);
    }
    return values;
}

function generateStep(points: number): number[] {
    const values: number[] = [];
    const levels = [0.2, 0.7, 0.4, 0.9, 0.3, 0.8, 0.5];
    for (let i = 0; i < points; i++) {
        const segment = Math.floor((i / points) * levels.length);
        values.push(levels[Math.min(segment, levels.length - 1)]);
    }
    return values;
}

const POINT_COUNT = 100;

export const datasets: Record<string, Dataset> = {
    sine: { name: 'Sine Wave', values: generateSine(POINT_COUNT) },
    stock: { name: 'Stock Price', values: generateStock(POINT_COUNT) },
    step: { name: 'Step Function', values: generateStep(POINT_COUNT) },
};
