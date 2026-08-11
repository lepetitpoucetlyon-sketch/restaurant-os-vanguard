/**
 * 🎨 THEME CONTRACT TYPES (GRADE X)
 *
 * Canonical theme primitives shared across the Nexus contracts layer and the
 * state layer (themeAtoms). Kept in nexus-contracts so both the runtime state
 * atoms and the NexusTheme contract can depend on a single source of truth
 * without the contracts layer reaching down into `store/`.
 */
export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'gold' | 'emerald' | 'sapphire' | 'ruby' | 'amethyst';
export type UIDensity = 'compact' | 'premium' | 'cinematic';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large';
