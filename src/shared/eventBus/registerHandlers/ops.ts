import { registerOpsKdsHandlers } from "./ops-kds";
import { registerOpsServiceHandlers } from "./ops-service";
import { registerOpsTableHandlers } from "./ops-tables";
import { registerOpsReservationHandlers } from "./ops-reservations";
import { registerOpsDeliveryHandlers } from "./ops-delivery";
import { registerOpsBarHandlers } from "./ops-bar";
import { registerOpsPrintHandlers } from "./ops-print";

export function registerOpsHandlers(): Array<() => void> {
  return [
    ...registerOpsKdsHandlers(),
    ...registerOpsServiceHandlers(),
    ...registerOpsTableHandlers(),
    ...registerOpsReservationHandlers(),
    ...registerOpsDeliveryHandlers(),
    ...registerOpsBarHandlers(),
    ...registerOpsPrintHandlers(),
  ];
}
