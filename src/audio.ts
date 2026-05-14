// iOS Safari (and Chrome on iOS, which uses WebKit) requires:
//   1. A prefixed webkitAudioContext fallback on older versions.
//   2. AudioContext to be created and resumed inside a user-gesture handler.
//   3. The hardware mute switch to be OFF — the silent switch blocks Web Audio.

type AudioCtxCtor = typeof AudioContext;
const Ctor: AudioCtxCtor | undefined =
    (window.AudioContext as AudioCtxCtor | undefined) ??
    ((window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext);

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isInitialized = false;

const FREQ = 300;

export function initAudio(): void {
    if (isInitialized || !Ctor) return;

    audioCtx = new Ctor();
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
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        // resume() returns a Promise; we don't need to await — fire and forget.
        // On iOS this MUST be called synchronously inside the user-gesture handler.
        void audioCtx.resume();
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
