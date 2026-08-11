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
export { GeminiProvider } from './ia/GeminiProvider';
export { RealtimeVoiceFactory } from './ia/realtime/RealtimeVoiceFactory';
export type { IRealtimeVoiceService } from './ia/realtime/IRealtimeVoiceService';
export { AgentEngine } from './ia/ai/AgentEngine';
export type { ZeusPulseResult, ZeusAnomaly, ZeusManifest } from './domain/agency/Zeus';
export { HermesDashboard } from './ia/ai/HermesDashboard';
export { QuantumDashboard } from './ia/fleet/QuantumDashboard';
export { SimulatorConsole } from './ia/simulator/components/SimulatorConsole';
export { TelemetryStream } from './analytique/TelemetryStream';
export type { TelemetryEvent } from './analytique/TelemetryStream';
export { TelemetryHook } from './analytique/TelemetryHook';
export { ConnectorHub } from './connectors/hub';


// 🏛️ Domaine Schemas
export { useNexusFleet } from './ia/fleet/NexusFleetProvider';
export { createLLMProvider } from './ia/ai/LLMProviderFactory';
export { FleetOutboxDrainService } from './ia/fleet/FleetOutboxDrainService';
export { IntegrationsPage } from './connectors/hub/components/IntegrationsPage';
export { fleetEngine } from './ia/fleet/FleetAdapter';
export type { PulseCategory, SanitizedPulse, MarketInsight, MonetizationTier } from './knowledge/rag/types';
export * from './domain/schemas/supportTicket';
