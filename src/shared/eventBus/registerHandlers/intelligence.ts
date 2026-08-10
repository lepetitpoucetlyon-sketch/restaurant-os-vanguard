import { registerIntelligenceHandler } from '../handlers/IntelligenceHandler';
import { OracleQueryAuditHandler } from '../handlers/OracleQueryAuditHandler';
import { AutoIndexationHandler } from '../handlers/AutoIndexationHandler';
import { WeeklyReportHandler } from '../handlers/WeeklyReportHandler';
import { FleetStratBriefingHandler } from '../handlers/FleetStratBriefingHandler';
import { OnboardingProgressHandler } from '../handlers/OnboardingProgressHandler';
import { GracePeriodHandler } from '../handlers/GracePeriodHandler';
import { PinLockoutNotifierHandler } from '../handlers/PinLockoutNotifierHandler';
import { FleetOutboxHandler } from '../handlers/FleetOutboxHandler';
import { registerReportRetryHandler } from '../handlers/ReportRetryHandler';
import { registerLLMFallbackHandler } from '../handlers/LLMFallbackHandler';
import { registerSupportTicketAnalysisHandler } from '../handlers/SupportTicketAnalysisHandler';
import { registerSalesDataReadyHandler } from '../handlers/SalesDataReadyHandler';
import { registerAnomalyDetectedHandler } from '../handlers/AnomalyDetectedHandler';
import { registerMenuEngineeringHandler } from '../handlers/MenuEngineeringHandler';
import { registerMenu86IntelligenceHandler } from '../handlers/Menu86IntelligenceHandler';
import { registerBCGActionSuggestionHandler } from '../handlers/BCGActionSuggestionHandler';

export function registerIntelligenceHandlers(): Array<() => void> {
  return [
    registerSalesDataReadyHandler(),
    registerAnomalyDetectedHandler(),
    registerIntelligenceHandler(),
    OracleQueryAuditHandler.register(),
    AutoIndexationHandler.register(),
    WeeklyReportHandler.register(),
    FleetStratBriefingHandler.register(),
    OnboardingProgressHandler.register(),
    GracePeriodHandler.register(),
    PinLockoutNotifierHandler.register(),
    FleetOutboxHandler.register(),
    registerReportRetryHandler(),
    registerLLMFallbackHandler(),
    registerSupportTicketAnalysisHandler(),
    // ── 9.1 : Menu Engineering BCG ────────────────────────────────────────
    registerMenuEngineeringHandler(),
    // ── I4 : Stock zéro → recalcul menu 86 ───────────────────────────────
    registerMenu86IntelligenceHandler(),
    registerBCGActionSuggestionHandler(),
  ];
}
