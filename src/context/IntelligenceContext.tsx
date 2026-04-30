"use client";
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';
import { NexusFleetState } from '@nexus/contracts/nexus.types';

export const useIntelligence = () => {
    const fleet = useNexusFleet();
    return fleet?.intelligence;
};

export const IntelligenceProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
