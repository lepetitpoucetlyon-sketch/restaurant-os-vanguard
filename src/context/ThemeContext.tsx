// @ts-nocheck
"use client";
import { useNexusCore } from '@/engines/core/NexusCoreProvider';
export const useTheme = () => useNexusCore()?.theme;
export const ThemeProvider = ({ children }: { children: any }) => <>{children}</>;
