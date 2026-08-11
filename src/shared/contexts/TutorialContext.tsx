/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";
import { useNexusFleet } from '@/modules/intelligence/ia/fleet/NexusFleetProvider';
export const useTutorial = () => useNexusFleet()?.tutorial;
export const TutorialProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
