/**
 * kernel/ai — Barrel export du kernel IA.
 *
 * Deux scopes isolés :
 *   - kernel/ai/core   : types, guards, composer (universel)
 *   - kernel/ai/mcc    : registre MCC isolé (R1: interdit depuis modules/)
 *   - kernel/ai/tenant : registre Tenant isolé (R1: interdit depuis fleet/)
 */
export * from './core';
export * from './mcc';
export * from './tenant';
