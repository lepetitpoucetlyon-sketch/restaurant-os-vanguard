import { registerIntelligenceHandler } from '../handlers/IntelligenceHandler';
import { WeeklyReportHandler } from '../handlers/WeeklyReportHandler';
import { registerReportRetryHandler } from '../handlers/ReportRetryHandler';
import { registerLLMFallbackHandler } from '../handlers/LLMFallbackHandler';
import { registerSalesDataReadyHandler } from '../handlers/SalesDataReadyHandler';
import { registerAnomalyDetectedHandler } from '../handlers/AnomalyDetectedHandler';
import { registerMenuEngineeringHandler } from '../handlers/MenuEngineeringHandler';
import { registerMenu86IntelligenceHandler } from '../handlers/Menu86IntelligenceHandler';
import { registerBCGActionSuggestionHandler } from '../handlers/BCGActionSuggestionHandler';

export function registerIntelligenceAnalyticsHandlers(): Array<() => void> {
  return [
    registerSalesDataReadyHandler(),
    registerAnomalyDetectedHandler(),
    registerIntelligenceHandler(),
    WeeklyReportHandler.register(),
    registerReportRetryHandler(),
    registerLLMFallbackHandler(),
    registerMenuEngineeringHandler(),
    registerMenu86IntelligenceHandler(),
    registerBCGActionSuggestionHandler(),
  ];
}
