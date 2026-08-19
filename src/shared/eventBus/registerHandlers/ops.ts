import { registerOpsTableHandlers } from './ops-tables';
import { registerOpsReservationHandlers } from './ops-reservations';
import { registerOpsServiceHandlers } from './ops-service';
import { registerOpsKdsHandlers } from './ops-kds';
import { registerOpsDeliveryHandlers } from './ops-delivery';

export function registerOpsHandlers(): Array<() => void> {
  return [
    ...registerOpsTableHandlers(),
    ...registerOpsReservationHandlers(),
    ...registerOpsServiceHandlers(),
    ...registerOpsKdsHandlers(),
    ...registerOpsDeliveryHandlers(),
  ];
}
