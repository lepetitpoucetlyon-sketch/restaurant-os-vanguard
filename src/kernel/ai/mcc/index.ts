/**
 * kernel/ai/mcc — Barrel export du registre MCC.
 *
 * R1 : Ce module ne peut PAS être importé depuis src/modules/.
 */
export { MCCAIRegistry } from './MCCAIRegistry';
export { MCCProviderChain } from './MCCProviderChain';
export { MCCLLMTelemetry } from './MCCLLMTelemetry';
export { MCC_SYSTEM_PROMPTS } from './MCC_SYSTEM_PROMPTS';
export type { MCCPromptId, MCCPromptDef } from './MCC_SYSTEM_PROMPTS';
