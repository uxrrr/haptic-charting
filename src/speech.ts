// Web Speech API wrapper for screen-reader-style coordinate announcements.

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
let primed = false;

// iOS Safari requires the FIRST speechSynthesis.speak() call to happen
// synchronously inside a user-gesture handler. After that initial call
// (even if silent), subsequent speak() calls from timers/callbacks work.
// Call this from pointerdown.
export function primeSpeech(): void {
    if (!supported || primed) return;
    const utter = new SpeechSynthesisUtterance('');
    utter.volume = 0;
    window.speechSynthesis.speak(utter);
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
}

export function cancelSpeech(): void {
    if (!supported) return;
    window.speechSynthesis.cancel();
}

export function isSpeechSupported(): boolean {
    return supported;
}
