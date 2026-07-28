"use client";
import { useNexusFleet } from '@/modules/intelligence/fleet';

export const useIntelligence = () => {
    const fleet = useNexusFleet();
    return fleet?.intelligence;
};

export const IntelligenceProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
