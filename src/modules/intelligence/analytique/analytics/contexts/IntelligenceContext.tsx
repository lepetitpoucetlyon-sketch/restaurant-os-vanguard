// @wip owner:intelligence-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";
import { useNexusFleet } from '@/shared/providers/fleet';

export const useIntelligence = () => {
    const fleet = useNexusFleet();
    return fleet?.intelligence;
};

export const IntelligenceProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
