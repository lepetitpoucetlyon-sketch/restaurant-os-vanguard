import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { CartItem } from '@/modules/ops';
import type { BridgePayload, PaymentMode } from './FinancialNexusTypes';

export function emitPaymentEvents(
  entryId: string,
  payload: BridgePayload,
  totalTTCInMicrounits: number,
  cartItems: CartItem[],
  paymentMode: PaymentMode
): void {
  const { tableId, tenantId, operatorId } = payload;
  NexusEventBus.emitDurable('order.paid', {
    v: 1,
    orderId: entryId,
    tableId,
    tenantId,
    operatorId,
    items: cartItems,
    totalInMicrounits: totalTTCInMicrounits,
    paymentMode: (payload.partialPayments && payload.partialPayments.length > 0) ? 'split' : paymentMode,
  }).catch(() => {});

  if (payload.partialPayments && payload.partialPayments.length > 0) {
    NexusEventBus.emitDurable('order.split', {
      v: 1,
      orderId: entryId,
      tableId,
      tenantId,
      operatorId,
      totalInMicrounits: totalTTCInMicrounits,
      payments: payload.partialPayments.map(p => ({ amount: p.amount, guest: p.guest, method: p.method ?? 'card' })),
    }).catch(() => {});
  } else if (paymentMode === 'comp' || totalTTCInMicrounits === 0) {
    NexusEventBus.emitDurable('order.comp', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      items: cartItems,
      totalValueInMicrounits: totalTTCInMicrounits,
      reason: 'Offert par la direction',
    }).catch(() => {});
  } else if (totalTTCInMicrounits < 0) {
    NexusEventBus.emitDurable('order.refunded', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      amountInMicrounits: Math.abs(totalTTCInMicrounits),
      originalPaymentMode: paymentMode,
    }).catch(() => {});
  }
}
