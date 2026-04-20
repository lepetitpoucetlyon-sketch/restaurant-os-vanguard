import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'gold' | 'emerald' | 'sapphire' | 'ruby' | 'amethyst';
export type UIDensity = 'compact' | 'premium' | 'cinematic';
export type BorderRadius = 'none' | 'small' | 'medium' | 'large';

export const themeModeAtom = atomWithStorage<ThemeMode>('nexus_theme_mode', 'dark');
export const accentColorAtom = atomWithStorage<AccentColor>('nexus_accent_color', 'gold');
export const uiDensityAtom = atomWithStorage<UIDensity>('nexus_ui_density', 'premium');
export const borderRadiusAtom = atomWithStorage<BorderRadius>('nexus_border_radius', 'medium');
export const glassmorphismAtom = atomWithStorage<number>('nexus_glassmorphism', 20);
export const animationsEnabledAtom = atomWithStorage<boolean>('nexus_animations_enabled', true);
