 
 
export { LLMManager } from './LLMManager';
export { AIProviderRouter, aiRouter } from './AIProviderRouter';
export { AgentEngine } from './AgentEngine';
export { HermesEngine } from './HermesEngine';
export * from './types';
export { AnthropicProvider } from './AnthropicProvider';
export { OpenAIProvider } from './OpenAIProvider';
export { createLLMProvider, AI_MODELS, resolveModelId } from './LLMProviderFactory';
// Compat backward — le code qui importe AI_MODELS depuis GeminiProvider reste fonctionnel
export { GEMINI_MODELS } from '../GeminiProvider';
