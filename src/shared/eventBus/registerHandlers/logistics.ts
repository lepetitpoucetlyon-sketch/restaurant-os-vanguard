import { registerStockDeductionHandler } from '../handlers/StockDeductionHandler';
import { registerStockAlertHandler } from '../handlers/StockAlertHandler';
import { registerWasteStockReconciliationHandler } from '../handlers/WasteStockReconciliationHandler';
import { registerStockRestitutionHandler } from '../handlers/StockRestitutionHandler';
import { registerStockReceptionHandler } from '../handlers/StockReceptionHandler';
import { registerFoodCostRecomputer } from '../handlers/FoodCostRecomputer';
import { registerMarginWarningHandler } from '../handlers/MarginWarningHandler';
import { registerStockZeroBlockerHandler } from '../handlers/StockZeroBlockerHandler';
import { registerPhysicalInventoryHandler } from '../handlers/PhysicalInventoryHandler';
import { registerStockTransferHandler } from '../handlers/StockTransferHandler';

export function registerLogisticsHandlers(): Array<() => void> {
  return [
    registerStockDeductionHandler(),
    registerStockAlertHandler(),
    registerWasteStockReconciliationHandler(),
    registerStockRestitutionHandler(),
    registerStockReceptionHandler(),
    registerFoodCostRecomputer(),
    registerMarginWarningHandler(),
    registerStockZeroBlockerHandler(),
    registerPhysicalInventoryHandler(),
    registerStockTransferHandler(),
  ];
}
