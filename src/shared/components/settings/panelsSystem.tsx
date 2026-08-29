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

export const LazyIntegrationSettings = lazyPanel(() => import("@/shared/components/settings/IntegrationSettings"));
export const LazyReviewsSettings = lazyPanel(() => import("@/shared/components/settings/ReviewsSettings"));
export const LazyTablesSettings = lazyPanel(() => import("@/shared/components/settings/TablesSettings"));
export const LazyMigrationHub = lazyPanel(() => import("@/shared/components/settings/MigrationHub"));
export const LazyPrinterSettings = lazyPanel(() => import("@/shared/components/settings/PrinterSettings"));
export const LazyPaymentTerminalSettings = lazyPanel(() => import("@/shared/components/settings/PaymentTerminalSettings"));
export const LazyCashDrawerSettings = lazyPanel(() => import("@/shared/components/settings/CashDrawerSettings"));
export const LazyPayrollIntegrationPanel = lazyPanel(() =>
    import("@/shared/components/settings/PayrollIntegrationPanel").then(m => ({ default: m.PayrollIntegrationPanel })),
);
export const LazyApiKeysPanel = lazyPanel(() => import("@/shared/components/settings/ApiKeysPanel"));
export const LazyCustomDomainPanel = lazyPanel(() => import("@/shared/components/settings/CustomDomainPanel"));
export const LazyOnboardingChecklistPanel = lazyPanel(() =>
    import("@/shared/components/settings/panels/OnboardingChecklistSettingsPanel").then(m => ({ default: m.OnboardingChecklistSettingsPanel })),
);
export const LazyMaintenanceSettingsPanel = lazyPanel(() =>
    import("@/shared/components/settings/panels/MaintenanceSettingsPanel").then(m => ({ default: m.MaintenanceSettingsPanel })),
);
export const LazyDLQDiagnosticPanel = lazyPanel(() =>
    import("@/shared/components/settings/DLQDiagnosticPanel").then(m => ({ default: m.DLQDiagnosticPanel })),
);
export const LazyRBACTenantMatrix = lazyPanel(() =>
    import("@/shared/components/settings/RBACTenantMatrix").then(m => ({ default: m.RBACTenantMatrix })),
);


