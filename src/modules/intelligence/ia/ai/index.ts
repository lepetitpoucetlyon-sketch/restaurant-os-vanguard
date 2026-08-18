/* eslint-disable no-restricted-imports */
/* eslint-disable vanguard/no-inter-module-imports */
export { LLMManager } from './LLMManager';
export { AIProviderRouter, aiRouter } from './AIProviderRouter';
export { AgentEngine } from './AgentEngine';
export { HermesEngine } from './HermesEngine';
export * from './types';
export { AnthropicProvider } from './AnthropicProvider';
export { OpenAIProvider } from './OpenAIProvider';
export { MistralProvider } from './MistralProvider';
export { SovereignProvider } from './SovereignProvider';
export { SovereignSlmClient } from './SovereignSlmClient';
export { GeminiProvider } from '../GeminiProvider';
export { createLLMProvider, AI_MODELS, resolveModelId, detectProvider } from './LLMProviderFactory';
export type { AIProviderName } from './LLMProviderFactory';
// Compat backward — le code qui importe AI_MODELS depuis GeminiProvider reste fonctionnel
export { GEMINI_MODELS } from '../GeminiProvider';
