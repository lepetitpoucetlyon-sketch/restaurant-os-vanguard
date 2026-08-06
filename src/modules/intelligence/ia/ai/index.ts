/* eslint-disable no-restricted-imports */
/* eslint-disable vanguard/no-inter-module-imports */
export { LLMManager } from './LLMManager';
export { AIProviderRouter, aiRouter } from './AIProviderRouter';
export { AgentEngine } from './AgentEngine';
export { HermesEngine } from './HermesEngine';
export * from './types';
// AI_MODELS vit dans GeminiProvider (pas dans l'interface) — compat backward
export { AI_MODELS, GEMINI_MODELS } from '../GeminiProvider';
