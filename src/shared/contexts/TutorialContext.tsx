"use client";
import { useNexusFleet } from '@/modules/intelligence/fleet';
export const useTutorial = () => useNexusFleet()?.tutorial;
export const TutorialProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
