import { registerSovereignBreachHandler } from '../handlers/SovereignBreachHandler';
import { registerQuarantineHandler } from '../handlers/QuarantineHandler';
import { registerWasteToFoodCostHandler } from '@/modules/compliance';
import { registerQuarantineActivatedHandler } from '../handlers/QuarantineActivatedHandler';
import { registerRecallPOSBlockerHandler } from '../handlers/RecallPOSBlockerHandler';
import { registerDLCExpiryHandler } from '../handlers/DLCExpiryHandler';
import { registerIotOfflineAlertHandler } from '../handlers/IotOfflineAlertHandler';
import { registerHaccpCheckArchiverHandler } from '../handlers/HaccpCheckArchiverHandler';
import { registerNonConformActionHandler } from '../handlers/NonConformActionHandler';
import { registerTrainingComplianceAlertHandler } from '../handlers/TrainingComplianceAlertHandler';
import { registerComplianceDeadlineHandler } from '../handlers/ComplianceDeadlineHandler';
import { registerCertExpiryHandler } from '../handlers/CertExpiryHandler';
import { registerComplianceCalendarHandler } from '../handlers/ComplianceCalendarHandler';

export function registerComplianceHandlers(): Array<() => void> {
  return [
    registerSovereignBreachHandler(),
    registerQuarantineHandler(),
    registerWasteToFoodCostHandler(),
    registerQuarantineActivatedHandler(),
    registerRecallPOSBlockerHandler(),
    registerDLCExpiryHandler(),
    registerIotOfflineAlertHandler(),
    registerHaccpCheckArchiverHandler(),
    registerNonConformActionHandler(),
    registerTrainingComplianceAlertHandler(),
    registerComplianceDeadlineHandler(),
    registerCertExpiryHandler(),
    registerComplianceCalendarHandler(),
  ];
}
