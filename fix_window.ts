declare global {
  interface Window {
    awakenTheMonkey?: (intensity?: number) => void;
    silenceTheMonkey?: () => void;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any; // Wait, I need a better type for SpeechRecognition
    webkitSpeechRecognition: any;
  }
}
export {};
