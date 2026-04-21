"use client";
import React from 'react';
import { useNexusCore } from '@/engines/core/NexusCoreProvider';
export const useTheme = () => useNexusCore()?.theme;
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
