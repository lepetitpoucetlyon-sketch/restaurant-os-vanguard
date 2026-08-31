import { registerPhysicalInventoryHandler } from '../handlers/PhysicalInventoryHandler';
import { registerFridgeTempAlertHandler } from '../handlers/FridgeTempAlertHandler';
import { registerOrderCancelRestockHandler } from '../handlers/OrderCancelRestockHandler';
import { registerAutoSupplierDraftHandler } from '../handlers/AutoSupplierDraftHandler';
import { registerSupplierDeliveryReceivedHandler } from '../handlers/SupplierDeliveryReceivedHandler';
import { registerWasteValidatedHandler } from '../handlers/WasteValidatedHandler';
import { registerFoodDonationHandler } from '../handlers/FoodDonationHandler';
import { registerProcurementMismatchHandler } from '../handlers/ProcurementMismatchHandler';
import { registerWasteDailyAggregatorHandler } from '../handlers/WasteDailyAggregatorHandler';

export function registerSupplyHandlers(): Array<() => void> {
  return [
    registerPhysicalInventoryHandler(),
    registerFridgeTempAlertHandler(),
    registerOrderCancelRestockHandler(),
    registerAutoSupplierDraftHandler(),
    registerSupplierDeliveryReceivedHandler(),
    registerWasteValidatedHandler(),
    registerFoodDonationHandler(),
    registerProcurementMismatchHandler(),
    registerWasteDailyAggregatorHandler(),
  ];
}
