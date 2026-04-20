"use client";
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
export const useFleet = useNexusFleet;
export const FleetProvider = ({ children }: { children: any }) => <>{children}</>;
