/**
 * kernel/ai/tenant — Barrel export du registre Tenant.
 *
 * R1 : Ce module ne peut PAS être importé depuis app/api/admin/fleet/
 */
export { TenantAIRegistry, TenantAIRegistryInstance } from './TenantAIRegistry';
export { TenantProviderChain } from './TenantProviderChain';
export { TenantLLMTelemetry } from './TenantLLMTelemetry';
export { TENANT_SYSTEM_PROMPTS } from './TENANT_SYSTEM_PROMPTS';
export type { TenantPromptId, TenantPromptDef } from './TENANT_SYSTEM_PROMPTS';
