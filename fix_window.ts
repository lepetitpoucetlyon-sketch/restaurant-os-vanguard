declare global {
  interface Window {
    awakenTheMonkey?: (intensity?: number) => void;
    silenceTheMonkey?: () => void;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
export {};
