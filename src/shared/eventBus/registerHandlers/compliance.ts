import { registerSovereignBreachHandler } from '../handlers/SovereignBreachHandler';
import { registerQuarantineHandler } from '../handlers/QuarantineHandler';
import { registerWasteToFoodCostHandler } from '@/modules/compliance/qualite/haccp/handlers/WasteToFoodCostHandler';
import { registerQuarantineActivatedHandler } from '../handlers/QuarantineActivatedHandler';
import { registerRecallPOSBlockerHandler } from '../handlers/RecallPOSBlockerHandler';
import { registerDLCExpiryHandler } from '../handlers/DLCExpiryHandler';
import { registerDLCBlockerHandler } from '../handlers/DLCBlockerHandler';
import { registerIotOfflineAlertHandler } from '../handlers/IotOfflineAlertHandler';
import { registerHaccpCheckArchiverHandler } from '../handlers/HaccpCheckArchiverHandler';
import { registerNonConformActionHandler } from '../handlers/NonConformActionHandler';
import { registerTrainingComplianceAlertHandler } from '../handlers/TrainingComplianceAlertHandler';
import { registerComplianceDeadlineHandler } from '../handlers/ComplianceDeadlineHandler';
import { registerCertExpiryHandler } from '../handlers/CertExpiryHandler';
import { registerComplianceCalendarHandler } from '../handlers/ComplianceCalendarHandler';
import { registerCoolingCycleHandler } from '../handlers/CoolingCycleHandler';
import { registerHaccpCorrectiveActionHandler } from '../handlers/HaccpCorrectiveActionHandler';

export function registerComplianceHandlers(): Array<() => void> {
  return [
    registerHaccpCorrectiveActionHandler(),
    registerSovereignBreachHandler(),
    registerQuarantineHandler(),
    registerWasteToFoodCostHandler(),
    registerQuarantineActivatedHandler(),
    registerRecallPOSBlockerHandler(),
    // ── DLC : déduction stock (existant) + blocage POS (nouveau I1) ─────────
    registerDLCExpiryHandler(),
    registerDLCBlockerHandler(),
    registerIotOfflineAlertHandler(),
    registerHaccpCheckArchiverHandler(),
    registerNonConformActionHandler(),
    registerTrainingComplianceAlertHandler(),
    registerComplianceDeadlineHandler(),
    registerCertExpiryHandler(),
    registerComplianceCalendarHandler(),
    // ── HACCP 5.2 : cycle de refroidissement légal ────────────────────────
    registerCoolingCycleHandler(),
  ];
}
