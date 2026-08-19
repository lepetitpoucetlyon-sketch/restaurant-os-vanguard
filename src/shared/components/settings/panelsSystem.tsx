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

export const IntegrationSettings = lazyPanel(() => import("@/shared/components/settings/IntegrationSettings"));
export const ReviewsSettings = lazyPanel(() => import("@/shared/components/settings/ReviewsSettings"));
export const TablesSettings = lazyPanel(() => import("@/shared/components/settings/TablesSettings"));
export const MigrationHub = lazyPanel(() => import("@/shared/components/settings/MigrationHub"));
export const PrinterSettings = lazyPanel(() => import("@/shared/components/settings/PrinterSettings"));
export const PaymentTerminalSettings = lazyPanel(() => import("@/shared/components/settings/PaymentTerminalSettings"));
export const CashDrawerSettings = lazyPanel(() => import("@/shared/components/settings/CashDrawerSettings"));
export const PayrollIntegrationPanel = lazyPanel(() =>
    import("@/shared/components/settings/PayrollIntegrationPanel").then(m => ({ default: m.PayrollIntegrationPanel })),
);
export const ApiKeysPanel = lazyPanel(() => import("@/shared/components/settings/ApiKeysPanel"));
export const CustomDomainPanel = lazyPanel(() => import("@/shared/components/settings/CustomDomainPanel"));
export const OnboardingChecklistPanel = lazyPanel(() =>
    import("@/shared/components/settings/panels/OnboardingChecklistSettingsPanel").then(m => ({ default: m.OnboardingChecklistSettingsPanel })),
);
export const MaintenanceSettingsPanel = lazyPanel(() =>
    import("@/shared/components/settings/panels/MaintenanceSettingsPanel").then(m => ({ default: m.MaintenanceSettingsPanel })),
);
export const DLQDiagnosticPanel = lazyPanel(() =>
    import("@/shared/components/settings/DLQDiagnosticPanel").then(m => ({ default: m.DLQDiagnosticPanel })),
);
export const RBACTenantMatrix = lazyPanel(() =>
    import("@/shared/components/settings/RBACTenantMatrix").then(m => ({ default: m.RBACTenantMatrix })),
);


