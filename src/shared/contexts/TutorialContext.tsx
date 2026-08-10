"use client";
import { useNexusFleet } from '@/src/modules/intelligence/ia/fleet/NexusFleetProvider';;
export const useTutorial = () => useNexusFleet()?.tutorial;
export const TutorialProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
