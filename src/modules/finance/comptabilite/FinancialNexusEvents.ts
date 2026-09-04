import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { CartItem } from '@nexus/contracts';
import type { BridgePayload, PaymentMode } from './FinancialNexusTypes';

export async function emitPaymentEvents(
  entryId: string,
  payload: BridgePayload,
  totalTTCInMicrounits: number,
  cartItems: CartItem[],
  paymentMode: PaymentMode
): Promise<void> {
  const { tableId, tenantId, operatorId, kitchenOrderId } = payload;
  await NexusEventBus.emitDurable('order.paid', {
    v: 1,
    orderId: entryId,
    kitchenOrderId,
    tableId,
    tenantId,
    operatorId,
    items: cartItems,
    totalInMicrounits: totalTTCInMicrounits,
    paymentMode: (payload.partialPayments && payload.partialPayments.length > 0) ? 'split' : paymentMode,
  });

  if (payload.partialPayments && payload.partialPayments.length > 0) {
    await NexusEventBus.emitDurable('order.split', {
      v: 1,
      orderId: entryId,
      tableId,
      tenantId,
      operatorId,
      totalInMicrounits: totalTTCInMicrounits,
      payments: payload.partialPayments.map(p => ({ amountInMicrounits: p.amountInMicrounits, guest: p.guest, method: p.method ?? 'card' })),
    });
  } else if (paymentMode === 'comp' || totalTTCInMicrounits === 0) {
    await NexusEventBus.emitDurable('order.comp', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      items: cartItems,
      totalValueInMicrounits: totalTTCInMicrounits,
      reason: 'Offert par la direction',
    });
  } else if (totalTTCInMicrounits < 0) {
    await NexusEventBus.emitDurable('order.refunded', {
      v: 1,
      orderId: entryId,
      tenantId,
      operatorId,
      amountInMicrounits: Math.abs(totalTTCInMicrounits),
      originalPaymentMode: paymentMode,
    });
  }
}
