import { registerPhysicalInventoryHandler } from '../handlers/PhysicalInventoryHandler';
import { registerStockTransferHandler } from '../handlers/StockTransferHandler';
import { registerFridgeTempAlertHandler } from '../handlers/FridgeTempAlertHandler';
import { registerOrderCancelRestockHandler } from '../handlers/OrderCancelRestockHandler';
import { registerAutoSupplierDraftHandler } from '../handlers/AutoSupplierDraftHandler';
import { registerSupplierDeliveryReceivedHandler } from '../handlers/SupplierDeliveryReceivedHandler';
import { registerWasteValidatedHandler } from '../handlers/WasteValidatedHandler';
import { registerFoodDonationHandler } from '../handlers/FoodDonationHandler';

export function registerSupplyHandlers(): Array<() => void> {
  return [
    registerPhysicalInventoryHandler(),
    registerStockTransferHandler(),
    registerFridgeTempAlertHandler(),
    registerOrderCancelRestockHandler(),
    registerAutoSupplierDraftHandler(),
    registerSupplierDeliveryReceivedHandler(),
    registerWasteValidatedHandler(),
    registerFoodDonationHandler(),
  ];
}
