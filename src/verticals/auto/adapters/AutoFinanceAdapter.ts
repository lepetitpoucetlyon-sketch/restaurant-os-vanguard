import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoFinanceAdapter = {
  emitInvoiceIssued(payload: { tenantId: string; workOrderId: string; customerId: string; totalInMicrounits: number; laborInMicrounits: number; partsInMicrounits: number }) {
    NexusEventBus.emitDurable('auto.invoice_issued', payload);
  },
  emitWarrantyClaimSubmitted(payload: { tenantId: string; vehicleId: string; claimId: string; amountInMicrounits: number; manufacturerId: string }) {
    NexusEventBus.emitDurable('auto.warranty_claim_submitted', payload);
  },
};
