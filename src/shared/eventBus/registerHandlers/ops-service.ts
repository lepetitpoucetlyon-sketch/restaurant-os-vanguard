import { registerCashDrawerAnomalyHandler } from '@/modules/ops';
import { registerRushModeIntegrationHandler } from '../handlers/RushModeIntegrationHandler';
import { registerEndOfServiceActionHandler } from '../handlers/EndOfServiceActionHandler';
import { registerDeliveryDriverUnlockHandler } from '../handlers/DeliveryDriverUnlockHandler';
import { registerFacilityHandlers } from '../handlers/FacilityHandlers';
import { registerHRClockInGuardHandler } from '../handlers/HRClockInGuardHandler';
import { registerPrinterMappingHandler } from '../handlers/PrinterMappingHandler';
import { registerProformaHandler } from '../handlers/ProformaHandler';
import { registerKDSTicketDoneNotifier } from '../handlers/KDSTicketDoneNotifier';
import { registerKDSRushAlertNotifier } from '../handlers/KDSRushAlertNotifier';

export function registerOpsServiceHandlers(): Array<() => void> {
  return [
    registerKDSTicketDoneNotifier(),
    registerKDSRushAlertNotifier(),
    registerCashDrawerAnomalyHandler(),
    registerRushModeIntegrationHandler(),
    registerEndOfServiceActionHandler(),
    registerDeliveryDriverUnlockHandler(),
    registerFacilityHandlers(),
    registerHRClockInGuardHandler(),
    registerPrinterMappingHandler(),
    registerProformaHandler(),
  ];
}
