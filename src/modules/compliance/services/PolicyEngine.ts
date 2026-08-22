/**
 * Re-export canonique pour rétro-compatibilité interne au module compliance.
 * L'implémentation est hébergée dans src/lib/permissions/PolicyEngine.ts (ADR-015).
 */
export { PolicyEngine, policyEngine, type PolicyCheckResult } from '@/lib/permissions/PolicyEngine';
