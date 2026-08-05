import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { JournalEntry } from '@nexus/contracts';

export const RestaurantFinanceAdapter = {
  emitOrderFiscalSeal(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
  emitZReportRequested(payload: { tenantId: string; operatorId: string; requestedAt: string }) {
    NexusEventBus.emitDurable('finance.z_report_requested', payload);
  },
  emitRefundIssued(payload: { tenantId: string; referenceId: string; amountInMicrounits: number; reason: string }) {
    NexusEventBus.emitDurable('finance.refund_issued', payload);
  },
};
