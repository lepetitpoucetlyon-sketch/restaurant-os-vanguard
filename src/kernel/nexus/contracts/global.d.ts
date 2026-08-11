export {};

declare global {
  interface Window {
    awakenTheMonkey: (intensity?: number) => void;
    silenceTheMonkey: () => void;
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}
