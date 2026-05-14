export interface Dataset {
    name: string;
    description: string;
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
    let price = 0.2;
    for (let i = 0; i < points; i++) {
        price += (Math.random() - 0.5) * 0.04 + 0.006;
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
    sine: {
        name: 'Sine Wave',
        description: 'A sine wave chart showing two full oscillation cycles, smoothly rising and falling between 10% and 90% of the value range.',
        values: generateSine(POINT_COUNT),
    },
    stock: {
        name: 'Stock Price',
        description: 'A stock price chart showing an overall upward trend with random fluctuations, starting low and climbing toward the upper range.',
        values: generateStock(POINT_COUNT),
    },
    step: {
        name: 'Step Function',
        description: 'A step function chart with seven discrete horizontal levels, alternating between low and high values in sudden jumps.',
        values: generateStep(POINT_COUNT),
    },
};
