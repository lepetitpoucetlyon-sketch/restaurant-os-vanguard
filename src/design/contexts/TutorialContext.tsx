/* eslint-disable no-restricted-imports -- design layer may import from modules */
"use client";
import { useNexusFleet } from '@/modules/intelligence';
export const useTutorial = () => useNexusFleet()?.tutorial;
export const TutorialProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
