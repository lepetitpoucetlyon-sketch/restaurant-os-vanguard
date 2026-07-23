import { atomWithStorage } from 'jotai/utils';
import type { ThemeMode, AccentColor, UIDensity, BorderRadius } from '@nexus/contracts';
import { tenantScopedJSONStorage } from '@/lib/storage/tenantScopedKey';

// Re-export the canonical theme primitives (declared in nexus-contracts) so
// existing consumers importing them from `@/store/themeAtoms` keep working.
export type { ThemeMode, AccentColor, UIDensity, BorderRadius };

export const themeModeAtom = atomWithStorage<ThemeMode>('nexus_theme_mode', 'dark', tenantScopedJSONStorage<ThemeMode>());
export const accentColorAtom = atomWithStorage<AccentColor>('nexus_accent_color', 'gold', tenantScopedJSONStorage<AccentColor>());
export const uiDensityAtom = atomWithStorage<UIDensity>('nexus_ui_density', 'premium', tenantScopedJSONStorage<UIDensity>());
export const borderRadiusAtom = atomWithStorage<BorderRadius>('nexus_border_radius', 'medium', tenantScopedJSONStorage<BorderRadius>());
export const glassmorphismAtom = atomWithStorage<number>('nexus_glassmorphism', 20, tenantScopedJSONStorage<number>());
export const animationsEnabledAtom = atomWithStorage<boolean>('nexus_animations_enabled', true, tenantScopedJSONStorage<boolean>());
