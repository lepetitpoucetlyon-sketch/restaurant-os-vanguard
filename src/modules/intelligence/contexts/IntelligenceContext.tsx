"use client";
import { useNexusFleet } from '@/engines/fleet/NexusFleetProvider';

export const useIntelligence = () => {
    const fleet = useNexusFleet();
    return fleet?.intelligence;
};

export const IntelligenceProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
