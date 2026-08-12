"use client";
import { useNexusCore } from '@/shared/hooks';

/**
 * Pont léger vers l'état thème du Nexus Core (couche design).
 * Rapatrié depuis `@/shared/contexts/ThemeContext` (étape 1 vidage shared/).
 */
export const useTheme = () => useNexusCore()?.theme;
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
