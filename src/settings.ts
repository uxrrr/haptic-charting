export interface Settings {
    sound: boolean;
    haptic: boolean;
    screenReader: boolean;
}

const STORAGE_KEY = 'haptic-charting:settings';

export function defaultSettings(): Settings {
    const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    return {
        sound: !hasVibration,
        haptic: hasVibration,
        screenReader: false,
    };
}

export function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultSettings();
        const parsed = JSON.parse(raw);
        return { ...defaultSettings(), ...parsed };
    } catch {
        return defaultSettings();
    }
}

export function saveSettings(s: Settings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
        /* ignore quota or privacy-mode errors */
    }
}
