// Domaine : analytique (analytics, reports, attendance, anomaly)
export * from './analytique/analytics';
export { buildWeeklyReportHTML } from './analytique/reports/weeklyReport';
export { AnomalyDetector } from './analytique/anomaly/AnomalyDetector';
export { TelemetryStream, type TelemetryEvent } from './analytique/TelemetryStream';
export { TelemetryHook } from './analytique/TelemetryHook';
export * from './analytique/store/dashboardAtoms';

// Domaine : ia (AI, agency, fleet, simulator, resilience, tools)
export * from './ia/ai';
// DNAInjector is NOT exported here — it imports @/instances which creates a circular dep through lepetitpoucet → @/modules/intelligence
export { ShieldedContext, SovereignSecurityViolation } from './ia/ai/ShieldedContext';
export * from './ia/agency';
export * from './ia/fleet';
export { CircuitBreaker } from './ia/resilience/CircuitBreaker';
export { FleetOutboxDrainService } from './ia/fleet/FleetOutboxDrainService';
export { GeminiProvider } from './ia/ai/GeminiProvider';
export { RealtimeVoiceFactory } from './ia/realtime/RealtimeVoiceFactory';
export type { IRealtimeVoiceService } from './ia/realtime/IRealtimeVoiceService';

export * from './ia/simulator';

// Domaine : knowledge (RAG)
export * from './knowledge/rag';

export { LLMManager, AIProviderRouter, AI_MODELS } from './ia/ai';
export { createLLMProvider, resolveModelId, type AIProviderName } from './ia/ai/LLMProviderFactory';
export { sovereignCreateWorkspace } from './knowledge/rag';
export type { ToolDefinition } from './domain/agent/tools/types';
export type { ILLMProvider } from './ia/ai/types';
export type { LLMTextRequest } from './ia/ai/types';
export type { LLMTextResponse } from './ia/ai/types';
export type { LLMVisionRequest } from './ia/ai/types';
export { simulatorDb } from './ia/simulator/SimulatorDB';
export { SimulationService, type SimulationProfile, type MonteCarloResult } from './ia/simulator/SimulationService';
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
export { DataDigester } from './services/DataDigester';
export { fleetTelemetry } from './ia/fleet/FleetTelemetryService';
export type { FleetInsight } from './services/MacroBrain';
export { useStrategicOracle } from './hooks/useStrategicOracle';
// analytics/components removed from barrel: OraclePredictor → OracleEngine → MonkeyChaos → finance (cycle).
export { LightRAGClient } from './knowledge/rag/LightRAGClient';
export { HermesKnowledgeManager } from './knowledge/rag/HermesKnowledgeManager';
export { ConnectorHub } from './connectors/hub';
export { SimulationDashboard } from './ia/simulator/components/SimulationDashboard';
export { IntegrationsPage } from './connectors/hub/components/IntegrationsPage';
export { OraclePredictor } from './analytique/analytics/components/OraclePredictor';
export {
  ProfitabilityView,
  ReputationView,
  ComplianceView,
  MenuEngineeringMatrix,
} from './analytique/analytics/components';

// 🏛️ Domaine Schemas
export * from './domain/schemas/supportTicket';

// 🤖 Universal Assistant & Action Dispatcher
export { UniversalSystemPromptBuilder, VERTICAL_LABELS_MAP } from './services/UniversalSystemPromptBuilder';
export { AssistantActionDispatcher, UNIVERSAL_ASSISTANT_TOOLS } from './services/AssistantActionDispatcher';
export { OracleIntentAugmenter } from './services/OracleIntentAugmenter';
// UniversalAssistantFrame removed from barrel: imports AssistantHeader → useUniversalAssistant (cycle).
// Import directly: '@/modules/intelligence/components/UniversalAssistantFrame'
export { ActionProposalCard } from './components/ActionProposalCard';
export type { ActionProposal, AssistantToolDefinition } from './services/AssistantActionDispatcher';
export { VisionService, type ExtractedInvoice, type PlateAuditResult } from './services/VisionService';
export * from './ia/ai/speculative';


export { AutomationsPanel } from "./automations/components/AutomationsPanel";
export { AutomationBuilder } from "./automations/components/AutomationBuilder";
export { registerAutomationRunner } from "./automations/engine/AutomationRunner";
export { BrandingService, type BrandInput } from "./services/BrandingService";
export { Slayer } from "./services/Slayer";
export { IdentityGuardService } from "./services/IdentityGuardService";
