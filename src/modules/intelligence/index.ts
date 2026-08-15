// Domaine : analytique (analytics, reports, attendance, anomaly)
export * from './analytique/analytics';
export { buildWeeklyReportHTML } from './analytique/reports/weeklyReport';
export { AnomalyDetector } from './analytique/anomaly/AnomalyDetector';

// Domaine : ia (AI, agency, fleet, simulator, resilience, tools)
export * from './ia/ai';
// DNAInjector is NOT exported here — it imports @/instances which creates a circular dep through lepetitpoucet → @/modules/intelligence
export { ShieldedContext, SovereignSecurityViolation } from './ia/ai/ShieldedContext';
export * from './ia/agency';
export * from './ia/fleet';
export { CircuitBreaker } from './ia/resilience/CircuitBreaker';
export { AGENT_TOOLS, TOOL_SCHEMAS } from './domain/agent/tools';

export * from './ia/simulator';


// Domaine : knowledge (RAG)
export * from './knowledge/rag';

export { LLMManager } from './ia/ai';
export { AI_MODELS } from './ia/ai';
export { sovereignCreateWorkspace } from './knowledge/rag';
export type { ToolDefinition } from './domain/agent/tools/types';
export type { ILLMProvider } from './ia/ai/types';
export type { LLMTextRequest } from './ia/ai/types';
export type { LLMTextResponse } from './ia/ai/types';
export type { LLMVisionRequest } from './ia/ai/types';
export { simulatorDb } from './ia/simulator/SimulatorDB';
export { useExpert } from './domain/agency/useExpert';
export { predictAttendance } from './analytique/attendance';
export type { AgentDomain } from './domain/agency/types';
export type { AgentRole } from './domain/agency/types';
export type { AgentResponse } from './domain/agency/types';
export type { AgentReasoningStep } from './domain/agency/types';
export { K_ANONYMITY_THRESHOLD } from './knowledge/rag/types';
export type { SimulationMetrics } from './ia/simulator/TemporalSimulator';
export { OracleEngine } from './services/OracleEngine';
export { MacroBrain } from './services/MacroBrain';
export { fleetTelemetry } from './ia/fleet/FleetTelemetryService';
export type { FleetInsight } from './services/MacroBrain';
export { OraclePredictor } from './analytique/analytics/components';
export { LightRAGClient } from './knowledge/rag/LightRAGClient';
export { HermesKnowledgeManager } from './knowledge/rag/HermesKnowledgeManager';
export { ConnectorHub } from './connectors/hub';


// 🏛️ Domaine Schemas
export * from './domain/schemas/supportTicket';

// 🤖 Universal Assistant & Action Dispatcher
export { UniversalSystemPromptBuilder, VERTICAL_LABELS_MAP } from './services/UniversalSystemPromptBuilder';
export { AssistantActionDispatcher, UNIVERSAL_ASSISTANT_TOOLS } from './services/AssistantActionDispatcher';
export type { ActionProposal, AssistantToolDefinition } from './services/AssistantActionDispatcher';
export { UniversalAssistantFrame } from './components/UniversalAssistantFrame';
export { ActionProposalCard } from './components/ActionProposalCard';
