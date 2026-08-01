import { registerCashDrawerAnomalyHandler } from '@/modules/ops/service/pos/handlers/CashDrawerAnomalyHandler';
import { registerKdsRoutingHandler } from '../handlers/KdsRoutingHandler';
import { registerKdsCourseManagerHandler } from '../handlers/KdsCourseManagerHandler';
import { registerKdsPrepTimeAnalyzerHandler } from '../handlers/KdsPrepTimeAnalyzerHandler';
import { registerKdsPassNotifierHandler } from '../handlers/KdsPassNotifierHandler';
import { registerKdsPrintFallbackHandler } from '../handlers/KdsPrintFallbackHandler';
import { registerReservationNotifierHandler } from '../handlers/ReservationNotifierHandler';
import { registerFloorPlanCapacityHandler } from '../handlers/FloorPlanCapacityHandler';
import { registerNoShowPenaltyHandler } from '../handlers/NoShowPenaltyHandler';
import { registerTableTurnoverAnalyzerHandler } from '../handlers/TableTurnoverAnalyzerHandler';
import { registerResaReminderHandler } from '../handlers/ResaReminderHandler';
import { registerResaKitchenTaskHandler } from '../handlers/ResaKitchenTaskHandler';
import { registerNoShowTableReleaseHandler } from '../handlers/NoShowTableReleaseHandler';
import { registerTableAutoReleaseHandler } from '../handlers/TableAutoReleaseHandler';
import { registerBigGroupAlertHandler } from '../handlers/BigGroupAlertHandler';
import { registerAntiCorruptionLayerHandler } from '../handlers/AntiCorruptionLayerHandler';
import { registerOrderAcceptanceWindowHandler } from '../handlers/OrderAcceptanceWindowHandler';
import { registerAggregatorMenuSyncHandler } from '../handlers/AggregatorMenuSyncHandler';
import { registerAggregatorStockSyncHandler } from '../handlers/AggregatorStockSyncHandler';
import { registerDeliveryRushModeHandler } from '../handlers/DeliveryRushModeHandler';

export function registerOpsHandlers(): Array<() => void> {
  return [
    registerCashDrawerAnomalyHandler(),
    registerKdsRoutingHandler(),
    registerKdsCourseManagerHandler(),
    registerKdsPrepTimeAnalyzerHandler(),
    registerKdsPassNotifierHandler(),
    registerKdsPrintFallbackHandler(),
    registerReservationNotifierHandler(),
    registerFloorPlanCapacityHandler(),
    registerNoShowPenaltyHandler(),
    registerTableTurnoverAnalyzerHandler(),
    registerResaReminderHandler(),
    registerResaKitchenTaskHandler(),
    registerNoShowTableReleaseHandler(),
    registerTableAutoReleaseHandler(),
    registerBigGroupAlertHandler(),
    registerAntiCorruptionLayerHandler(),
    registerOrderAcceptanceWindowHandler(),
    registerAggregatorMenuSyncHandler(),
    registerAggregatorStockSyncHandler(),
    registerDeliveryRushModeHandler(),
  ];
}
