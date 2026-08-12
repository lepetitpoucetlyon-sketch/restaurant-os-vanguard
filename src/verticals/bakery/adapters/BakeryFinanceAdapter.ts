import { NexusEventBus } from '@orchestration/NexusEventBus';

export const BakeryFinanceAdapter = {
  emitSaleSealed(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
  emitZReportRequested(payload: { tenantId: string; operatorId: string; requestedAt: string }) {
    NexusEventBus.emitDurable('finance.z_report_requested', payload);
  },
};
