import { registerAntiCorruptionLayerHandler } from '../handlers/AntiCorruptionLayerHandler';
import { registerOrderAcceptanceWindowHandler } from '../handlers/OrderAcceptanceWindowHandler';
import { registerAggregatorMenuSyncHandler } from '../handlers/AggregatorMenuSyncHandler';
import { registerAggregatorStockSyncHandler } from '../handlers/AggregatorStockSyncHandler';
import { registerDeliveryRushModeHandler } from '../handlers/DeliveryRushModeHandler';

export function registerOpsDeliveryHandlers(): Array<() => void> {
  return [
    registerAntiCorruptionLayerHandler(),
    registerOrderAcceptanceWindowHandler(),
    registerAggregatorMenuSyncHandler(),
    registerAggregatorStockSyncHandler(),
    registerDeliveryRushModeHandler(),
  ];
}
