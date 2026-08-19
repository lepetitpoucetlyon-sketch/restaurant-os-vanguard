import { registerWasteToFoodCostHandler } from '@/modules/compliance';
import { registerDLCExpiryHandler } from '../handlers/DLCExpiryHandler';
import { registerDLCBlockerHandler } from '../handlers/DLCBlockerHandler';
import { registerIotOfflineAlertHandler } from '../handlers/IotOfflineAlertHandler';
import { registerHaccpCheckArchiverHandler } from '../handlers/HaccpCheckArchiverHandler';
import { registerNonConformActionHandler } from '../handlers/NonConformActionHandler';
import { registerCoolingCycleHandler } from '../handlers/CoolingCycleHandler';
import { registerHaccpCorrectiveActionHandler } from '../handlers/HaccpCorrectiveActionHandler';

export function registerComplianceHaccpHandlers(): Array<() => void> {
  return [
    registerHaccpCorrectiveActionHandler(),
    registerWasteToFoodCostHandler(),
    registerDLCExpiryHandler(),
    registerDLCBlockerHandler(),
    registerIotOfflineAlertHandler(),
    registerHaccpCheckArchiverHandler(),
    registerNonConformActionHandler(),
    registerCoolingCycleHandler(),
  ];
}
