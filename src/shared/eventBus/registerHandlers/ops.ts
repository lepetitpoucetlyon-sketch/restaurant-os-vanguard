/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { registerCashDrawerAnomalyHandler } from '@/modules/ops/service/pos/handlers/CashDrawerAnomalyHandler';
import { registerReservationNotifierHandler } from '../handlers/ReservationNotifierHandler';
import { registerFloorPlanCapacityHandler } from '../handlers/FloorPlanCapacityHandler';
import { registerNoShowPenaltyHandler } from '../handlers/NoShowPenaltyHandler';
import { registerTableTurnoverAnalyzerHandler } from '../handlers/TableTurnoverAnalyzerHandler';
import { registerResaReminderHandler } from '../handlers/ResaReminderHandler';
import { registerResaKitchenTaskHandler } from '../handlers/ResaKitchenTaskHandler';
import { registerNoShowTableReleaseHandler } from '../handlers/NoShowTableReleaseHandler';
import { registerTableAutoReleaseHandler } from '../handlers/TableAutoReleaseHandler';
import { registerBigGroupAlertHandler } from '../handlers/BigGroupAlertHandler';
import { registerRushModeIntegrationHandler } from '../handlers/RushModeIntegrationHandler';
import { registerEndOfServiceActionHandler } from '../handlers/EndOfServiceActionHandler';
import { registerDeliveryDriverUnlockHandler } from '../handlers/DeliveryDriverUnlockHandler';
import { registerFacilityHandlers } from '../handlers/FacilityHandlers';
import { registerOpsKdsHandlers } from './ops-kds';
import { registerOpsDeliveryHandlers } from './ops-delivery';

export function registerOpsHandlers(): Array<() => void> {
  return [
    registerCashDrawerAnomalyHandler(),
    registerReservationNotifierHandler(),
    registerFloorPlanCapacityHandler(),
    registerNoShowPenaltyHandler(),
    registerTableTurnoverAnalyzerHandler(),
    registerResaReminderHandler(),
    registerResaKitchenTaskHandler(),
    registerNoShowTableReleaseHandler(),
    registerTableAutoReleaseHandler(),
    registerBigGroupAlertHandler(),
    registerRushModeIntegrationHandler(),
    registerEndOfServiceActionHandler(),
    registerDeliveryDriverUnlockHandler(),
    registerFacilityHandlers(),
    ...registerOpsKdsHandlers(),
    ...registerOpsDeliveryHandlers(),
  ];
}
