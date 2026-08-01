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
