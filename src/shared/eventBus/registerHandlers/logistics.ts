import { registerStockHandlers } from "./logistics-stock";
import { registerSupplyHandlers } from "./logistics-supply";
import { registerLogisticsProcurementHandlers } from "./logistics-procurement";

export function registerLogisticsHandlers(): Array<() => void> {
  return [
    ...registerStockHandlers(),
    ...registerSupplyHandlers(),
    ...registerLogisticsProcurementHandlers(),
  ];
}
