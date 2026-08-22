// Cœur agnostique uniquement. Le pont LLM (llmFromManager) s'importe explicitement
// via '@/verticals/_shared/sector-study/llmFromManager' pour ne pas coupler à l'IA.
export * from './SectorStudyAgent';
export * from './SectorStudyStore';
