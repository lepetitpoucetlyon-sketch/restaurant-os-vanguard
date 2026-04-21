export {};

declare global {
  interface Window {
    awakenTheMonkey: (key: string) => void;
  }
}
