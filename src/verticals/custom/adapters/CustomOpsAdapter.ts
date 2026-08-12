import { NexusEventBus } from '@orchestration/NexusEventBus';

export const CustomOpsAdapter = {
  emitSaleSealed(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
};
