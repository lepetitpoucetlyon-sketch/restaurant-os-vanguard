/**
 * Barrel des plugins verticaux — un seul point d'entrée pour les consommateurs
 * (réduit le fan-out des services qui orchestrent plusieurs verticales).
 */
export * from './VerticalRegistry';
export * from './CoreContext';
export type { IVerticalPlugin, ICoreContext } from './IVerticalPlugin';
