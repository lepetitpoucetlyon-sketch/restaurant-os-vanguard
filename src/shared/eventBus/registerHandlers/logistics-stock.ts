import { registerStockDeductionHandler, registerInventoryDeductedHandler } from '../handlers/StockDeductionHandler';
import { registerStockAlertHandler } from '../handlers/StockAlertHandler';
import { registerWasteStockReconciliationHandler } from '../handlers/WasteStockReconciliationHandler';
import { registerStockRestitutionHandler } from '../handlers/StockRestitutionHandler';
import { registerStockReceptionHandler } from '../handlers/StockReceptionHandler';
import { registerFoodCostRecomputer } from '../handlers/FoodCostRecomputer';
import { registerMarginWarningHandler } from '../handlers/MarginWarningHandler';
import { registerStockZeroBlockerHandler } from '../handlers/StockZeroBlockerHandler';

export function registerStockHandlers(): Array<() => void> {
  return [
    registerStockDeductionHandler(),
    registerInventoryDeductedHandler(),
    registerStockAlertHandler(),
    registerWasteStockReconciliationHandler(),
    registerStockRestitutionHandler(),
    registerStockReceptionHandler(),
    registerFoodCostRecomputer(),
    registerMarginWarningHandler(),
    registerStockZeroBlockerHandler(),
  ];
}
