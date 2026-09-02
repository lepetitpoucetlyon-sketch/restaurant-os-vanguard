import { registerCashDrawerAnomalyHandler } from '@/modules/ops';
import { registerRushModeIntegrationHandler } from '../handlers/RushModeIntegrationHandler';
import { registerEndOfServiceActionHandler } from '../handlers/EndOfServiceActionHandler';
import { registerDeliveryDriverUnlockHandler } from '../handlers/DeliveryDriverUnlockHandler';
import { registerFacilityHandlers } from '../handlers/FacilityHandlers';
import { registerHRClockInGuardHandler } from '@/modules/human';
import { registerPrinterMappingHandler } from '../handlers/PrinterMappingHandler';
import { registerProformaHandler } from '../handlers/ProformaHandler';
import { registerKDSTicketDoneNotifier } from '@/modules/ops';
import { registerKDSRushAlertNotifier } from '@/modules/ops';

import { registerWaiterCallHandler } from '../handlers/WaiterCallHandler';
import { registerSplitBillRegisteredHandler } from '../handlers/SplitBillRegisteredHandler';

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
    registerWaiterCallHandler(),
    registerSplitBillRegisteredHandler(),
  ];
}
