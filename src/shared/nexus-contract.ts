/**
 * @deprecated ⚠️ LEGACY CONTRACT RE-EXPORT
 * Ce fichier est maintenu uniquement pour la rétrocompatibilité temporaire.
 * Tout le nouveau code doit importer directement depuis '@/shared/nexus/contracts'.
 */

export * from "./nexus/contracts/sovereign.types";
export * from "./nexus/contracts/identity.types";
export * from "./nexus/contracts/nf525.types";
export * from "./nexus/contracts/settings/business-laws";
export * from "./nexus/contracts/infrastructure/telemetry.types";
export * from "./nexus/contracts/infrastructure/firebase.types";
export type { TenantConfig, OrchestratorSignal, TenantTheme } from "@/modules/system";

export { DEFAULT_TENANT_CONFIG } from "./nexus/contracts/settings/business-laws";
