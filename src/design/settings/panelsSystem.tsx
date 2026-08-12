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

export const IntegrationSettings = lazyPanel(() => import("@design/settings/IntegrationSettings"));
export const ReviewsSettings = lazyPanel(() => import("@design/settings/ReviewsSettings"));
export const TablesSettings = lazyPanel(() => import("@design/settings/TablesSettings"));
export const MigrationHub = lazyPanel(() => import("@design/settings/MigrationHub"));
export const PrinterSettings = lazyPanel(() => import("@design/settings/PrinterSettings"));
export const PaymentTerminalSettings = lazyPanel(() => import("@design/settings/PaymentTerminalSettings"));
export const CashDrawerSettings = lazyPanel(() => import("@design/settings/CashDrawerSettings"));
export const PayrollIntegrationPanel = lazyPanel(() =>
    import("@design/settings/PayrollIntegrationPanel").then(m => ({ default: m.PayrollIntegrationPanel })),
);
export const ApiKeysPanel = lazyPanel(() => import("@design/settings/ApiKeysPanel"));
export const CustomDomainPanel = lazyPanel(() => import("@design/settings/CustomDomainPanel"));
