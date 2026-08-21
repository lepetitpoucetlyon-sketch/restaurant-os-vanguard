/**
 * kernel/ai/core — Barrel export du kernel IA core.
 */
export * from './types';
export { AIScopeGuard } from './AIScopeGuard';
export { PromptComposer } from './PromptComposer';
export type { ComposeMCCInput, ComposeTenantInput } from './PromptComposer';
export { CrossScopeAuthority } from './CrossScopeAuthority';
export type { CrossScopeGrant, StoredToken as CrossScopeStoredToken } from './CrossScopeAuthority';
