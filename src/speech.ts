// Web Speech API wrapper for screen-reader-style coordinate announcements.
//
// iOS Safari quirks handled here:
//   1. The FIRST speak() must happen synchronously inside a user-gesture handler.
//      An empty/zero-volume utterance does NOT unlock the queue — it must have
//      real content and audible volume. We use a near-silent space character.
//   2. After speechSynthesis.cancel() the queue is paused. Calling speak()
//      alone won't play; we must also call resume() to keep the queue alive.

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
let primed = false;

export function primeSpeech(): void {
    if (!supported || primed) return;
    forcePrimeSpeech();
}

// Always speaks "ready" regardless of primed state — used by the Initialize
// button to manually force-prime iOS Safari when the implicit priming on
// toggle/pointerdown doesn't take.
export function forcePrimeSpeech(): void {
    if (!supported) return;
    const utter = new SpeechSynthesisUtterance('speech ready');
    utter.volume = 1;
    utter.rate = 1.3;
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    window.speechSynthesis.resume();
    primed = true;
}

export function speak(text: string): void {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.3;
    utter.pitch = 1;
    utter.volume = 1;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
    // iOS: after cancel() the queue is paused. resume() keeps subsequent speak()
    // calls flowing — without this, speak() from a timer silently no-ops on iOS.
    window.speechSynthesis.resume();
}

export function cancelSpeech(): void {
    if (!supported) return;
    window.speechSynthesis.cancel();
}

export function isSpeechSupported(): boolean {
    return supported;
}
