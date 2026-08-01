// Domaine : analytique (analytics, reports, attendance, anomaly)
export * from './analytique/analytics';
export { buildWeeklyReportHTML } from './analytique/reports/weeklyReport';
export { AnomalyDetector } from './analytique/anomaly/AnomalyDetector';

// Domaine : ia (AI, agency, fleet, simulator, resilience, tools)
export * from './ia/ai';
export * from './ia/agency';
export * from './ia/fleet/NexusFleetProvider';
export { CircuitBreaker } from './ia/resilience/CircuitBreaker';
export { SimulationDashboard } from './ia/simulator/components/SimulationDashboard';

// Domaine : knowledge (RAG)
export * from './knowledge/rag';
