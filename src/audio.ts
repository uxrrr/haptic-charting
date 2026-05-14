let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isInitialized = false;

const FREQ = 300;

export function initAudio(): void {
    if (isInitialized) return;

    audioCtx = new AudioContext();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = FREQ;
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    isInitialized = true;
}

export function resumeAudio(): void {
    if (audioCtx?.state === 'suspended') {
        audioCtx.resume();
    }
}

export function playForProximity(proximity: number): void {
    if (!gainNode || !oscillator || !audioCtx) return;

    if (proximity >= 1) {
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
        return;
    }

    const intensity = 1 - proximity;
    const volume = intensity * 0.4;

    gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.02);
}

export function stopAudio(): void {
    if (!gainNode || !audioCtx) return;
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
}
