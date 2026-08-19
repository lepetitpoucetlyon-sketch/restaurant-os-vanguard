import { registerSovereignBreachHandler } from '../handlers/SovereignBreachHandler';
import { registerQuarantineHandler } from '../handlers/QuarantineHandler';
import { registerQuarantineActivatedHandler } from '../handlers/QuarantineActivatedHandler';
import { registerRecallPOSBlockerHandler } from '../handlers/RecallPOSBlockerHandler';
import { registerTrainingComplianceAlertHandler } from '../handlers/TrainingComplianceAlertHandler';
import { registerComplianceDeadlineHandler } from '../handlers/ComplianceDeadlineHandler';
import { registerCertExpiryHandler } from '../handlers/CertExpiryHandler';
import { registerComplianceCalendarHandler } from '../handlers/ComplianceCalendarHandler';

export function registerComplianceAuditHandlers(): Array<() => void> {
  return [
    registerSovereignBreachHandler(),
    registerQuarantineHandler(),
    registerQuarantineActivatedHandler(),
    registerRecallPOSBlockerHandler(),
    registerTrainingComplianceAlertHandler(),
    registerComplianceDeadlineHandler(),
    registerCertExpiryHandler(),
    registerComplianceCalendarHandler(),
  ];
}
