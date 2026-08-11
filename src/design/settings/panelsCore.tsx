"use client";

/**
 * Registre des panneaux de réglages « cœur » (profil, gouvernance, exploitation).
 * Extrait de page.tsx pour réduire son fan-out (règle sentrux no_god_files).
 * Chaque panneau est chargé en lazy avec un skeleton partagé.
 */
import dynamic from "next/dynamic";
import { SettingsLoading } from "./_SettingsLoading";

const lazyPanel = <P extends object>(loader: () => Promise<{ default: React.ComponentType<P> }>) =>
    dynamic(loader, { loading: () => <SettingsLoading />, ssr: false });

export const ProfileSettings = lazyPanel(() => import("@/shared/components/settings/ProfileSettings"));
export const ExpertGovernanceHub = lazyPanel(() => import("@/shared/components/settings/ExpertGovernanceHub"));
export const NexusSettings = lazyPanel(() => import("@/shared/components/settings/NexusSettings"));
export const HoursSettings = lazyPanel(() => import("@/shared/components/settings/HoursSettings"));
export const ReservationSettingsComponent = lazyPanel(() => import("@/shared/components/settings/ReservationSettings"));
export const StaffSettings = lazyPanel(() => import("@/shared/components/settings/StaffSettings"));
export const MenuSettings = lazyPanel(() => import("@/shared/components/settings/MenuSettings"));
export const GoalsSettings = lazyPanel(() => import("@/shared/components/settings/GoalsSettings"));
