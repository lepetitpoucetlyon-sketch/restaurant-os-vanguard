export {};

declare global {
  interface Window {
    awakenTheMonkey: (intensity?: number) => void;
    silenceTheMonkey: () => void;
  }
}
