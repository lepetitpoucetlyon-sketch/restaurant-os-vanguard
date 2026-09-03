import { registerStockDeductionHandler, registerInventoryDeductedHandler } from '../handlers/StockDeductionHandler';
import { registerStockAlertHandler } from '../handlers/StockAlertHandler';
import { registerWasteStockReconciliationHandler } from '../handlers/WasteStockReconciliationHandler';
import { registerStockRestitutionHandler } from '../handlers/StockRestitutionHandler';
import { registerStockReceptionHandler } from '../handlers/StockReceptionHandler';
import { registerFoodCostRecomputer } from '../handlers/FoodCostRecomputer';
import { registerMarginWarningHandler } from '../handlers/MarginWarningHandler';
import { registerStockZeroBlockerHandler } from '../handlers/StockZeroBlockerHandler';
import { registerOrderCancelRestockHandler } from '../handlers/OrderCancelRestockHandler';
import { registerStockAdjustedHandler } from '../handlers/StockAdjustedHandler';
import { registerRecipeReconciliationHandler } from '../handlers/RecipeReconciliationHandler';

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
    registerOrderCancelRestockHandler(),
    registerStockAdjustedHandler(),
    registerRecipeReconciliationHandler(),
  ];
}
