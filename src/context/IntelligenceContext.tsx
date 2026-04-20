// @ts-nocheck
"use client";
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
export const useIntelligence = () => useNexusFleet()?.intelligence;
export const IntelligenceProvider = ({ children }: { children: any }) => <>{children}</>;
