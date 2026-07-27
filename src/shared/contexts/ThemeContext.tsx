"use client";
import { useNexusCore } from '@/shared/hooks';
export const useTheme = () => useNexusCore()?.theme;
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
