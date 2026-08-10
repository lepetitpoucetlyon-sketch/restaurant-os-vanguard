import { registerStockHandlers } from './logistics-stock';
import { registerSupplyHandlers } from './logistics-supply';

export function registerLogisticsHandlers(): Array<() => void> {
  return [
    ...registerStockHandlers(),
    ...registerSupplyHandlers(),
  ];
}
