import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RetailOpsAdapter = {
  emitSaleCompleted(payload: { tenantId: string; saleId: string; customerId?: string; lines: { productId: string; quantity: number; unitPriceInMicrounits: number }[]; totalInMicrounits: number; paymentMethod: string }) {
    NexusEventBus.emitDurable('retail.sale_completed', payload);
  },
  emitReturnProcessed(payload: { tenantId: string; returnId: string; originalSaleId: string; lines: { productId: string; quantity: number }[]; refundInMicrounits: number }) {
    NexusEventBus.emitDurable('retail.return_processed', payload);
  },
  emitPosSessionOpened(payload: { tenantId: string; sessionId: string; operatorId: string; openedAt: string; openingFloat: number }) {
    NexusEventBus.emit('retail.pos_session_opened', payload);
  },
  emitPosSessionClosed(payload: { tenantId: string; sessionId: string; operatorId: string; closedAt: string; totalInMicrounits: number }) {
    NexusEventBus.emitDurable('retail.pos_session_closed', payload);
  },
};
