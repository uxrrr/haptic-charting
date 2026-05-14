let vibrationTimer: ReturnType<typeof setTimeout> | null = null;
let isVibrating = false;

export function vibrateForProximity(proximity: number): void {
    if (!('vibrate' in navigator)) return;

    if (proximity >= 1) {
        stop();
        return;
    }

    const intensity = 1 - proximity;

    if (intensity > 0.85) {
        // Very close / on the line — continuous vibration
        if (!isVibrating) {
            startContinuous();
        }
    } else {
        // Pulsing — duty cycle proportional to closeness
        const period = 60;
        const onTime = Math.round(intensity * period);
        const offTime = period - onTime;

        if (onTime < 5) {
            stop();
            return;
        }

        navigator.vibrate([onTime, offTime]);
        isVibrating = true;

        if (vibrationTimer) clearTimeout(vibrationTimer);
        vibrationTimer = setTimeout(() => {
            isVibrating = false;
        }, period);
    }
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
