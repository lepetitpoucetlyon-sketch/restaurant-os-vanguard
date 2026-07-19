"use client";

/**
 * Registre des panneaux de réglages « système » (intégrations, matériel, migration, paie).
 * Extrait de page.tsx pour réduire son fan-out (règle sentrux no_god_files).
 * Chaque panneau est chargé en lazy avec un skeleton partagé.
 */
import dynamic from "next/dynamic";
import { SettingsLoading } from "./_SettingsLoading";

const lazyPanel = <P extends object>(loader: () => Promise<{ default: React.ComponentType<P> }>) =>
    dynamic(loader, { loading: () => <SettingsLoading />, ssr: false });

export const IntegrationSettings = lazyPanel(() => import("@/components/settings/IntegrationSettings"));
export const ReviewsSettings = lazyPanel(() => import("@/components/settings/ReviewsSettings"));
export const TablesSettings = lazyPanel(() => import("@/components/settings/TablesSettings"));
export const MigrationHub = lazyPanel(() => import("@/components/settings/MigrationHub"));
export const PrinterSettings = lazyPanel(() => import("@/components/settings/PrinterSettings"));
export const PaymentTerminalSettings = lazyPanel(() => import("@/components/settings/PaymentTerminalSettings"));
export const CashDrawerSettings = lazyPanel(() => import("@/components/settings/CashDrawerSettings"));
export const PayrollIntegrationPanel = lazyPanel(() =>
    import("@/components/settings/PayrollIntegrationPanel").then(m => ({ default: m.PayrollIntegrationPanel })),
);
