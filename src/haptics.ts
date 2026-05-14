let vibrationTimer: ReturnType<typeof setTimeout> | null = null;
let isVibrating = false;

export function vibrateForProximity(proximity: number): void {
    if (!('vibrate' in navigator)) return;
    if (proximity >= 1) {
        stop();
        return;
    }
    if (!isVibrating) startContinuous();
}

function startContinuous(): void {
    navigator.vibrate([100]);
    isVibrating = true;
    if (vibrationTimer) clearTimeout(vibrationTimer);
    vibrationTimer = setTimeout(() => {
        isVibrating = false;
    }, 100);
}

export function vibrateGridLine(): void {
    if (!('vibrate' in navigator)) return;
    navigator.vibrate(15);
}

export function stop(): void {
    if (vibrationTimer) {
        clearTimeout(vibrationTimer);
        vibrationTimer = null;
    }
    if (isVibrating) {
        navigator.vibrate(0);
        isVibrating = false;
    }
}
