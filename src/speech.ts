// Web Speech API wrapper for screen-reader-style coordinate announcements.

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
