import { OracleQueryAuditHandler } from '../handlers/OracleQueryAuditHandler';
import { AutoIndexationHandler } from '../handlers/AutoIndexationHandler';
import { FleetStratBriefingHandler } from '../handlers/FleetStratBriefingHandler';
import { FleetOutboxHandler } from '../handlers/FleetOutboxHandler';
import { OnboardingProgressHandler } from '../handlers/OnboardingProgressHandler';
import { GracePeriodHandler } from '../handlers/GracePeriodHandler';
import { PinLockoutNotifierHandler } from '../handlers/PinLockoutNotifierHandler';
import { registerSupportTicketAnalysisHandler } from '../handlers/SupportTicketAnalysisHandler';

export function registerIntelligenceFleetHandlers(): Array<() => void> {
  return [
    OracleQueryAuditHandler.register(),
    AutoIndexationHandler.register(),
    FleetStratBriefingHandler.register(),
    FleetOutboxHandler.register(),
    OnboardingProgressHandler.register(),
    GracePeriodHandler.register(),
    PinLockoutNotifierHandler.register(),
    registerSupportTicketAnalysisHandler(),
  ];
}
