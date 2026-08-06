import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const RetailFinanceAdapter = {
  emitSaleSealed(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
  emitRefundIssued(payload: { tenantId: string; referenceId: string; amountInMicrounits: number; reason: string }) {
    NexusEventBus.emitDurable('finance.refund_issued', payload);
  },
  emitZReportRequested(payload: { tenantId: string; operatorId: string; requestedAt: string }) {
    NexusEventBus.emitDurable('finance.z_report_requested', payload);
  },
};
