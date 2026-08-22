import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface SupplierDisputePayload {
  tenantId: string;
  adminId: string;
  deliverySlipId: string;
  supplierId: string;
  supplierName: string;
  disputedSku: string;
  productName: string;
  reason: 'damaged_goods' | 'temperature_break' | 'missing_items' | 'short_dlc' | 'wrong_product';
  disputedAmountInMicrounits: number;
  photoProofUrl?: string;
}

export interface DisputeRecord {
  disputeId: string;
  deliverySlipId: string;
  supplierId: string;
  creditNoteExpectedInMicrounits: number;
  sepaPaymentHold: boolean;
  status: 'opened_pending_credit_note';
  openedAt: number;
}

/**
 * SupplierDisputeWorkflowService — Angles morts H3 & L31.
 * Gestion des litiges à la livraison fournisseur : constat photo, blocage automatique du prélèvement SEPA sur le montant contesté et suivi de l'avoir.
 */
export class SupplierDisputeWorkflowService {
  static async openDispute(payload: SupplierDisputePayload): Promise<DisputeRecord> {
    const disputeId = `DISPUTE-${payload.tenantId}-${payload.deliverySlipId}-${Date.now()}`;

    NexusEventBus.emit('stock.supplier_dispute_opened', {
      v: 1,
      tenantId: payload.tenantId,
      deliverySlipId: payload.deliverySlipId,
      supplierId: payload.supplierId,
      disputedAmountInMicrounits: payload.disputedAmountInMicrounits,
      sepaHoldActive: true,
      openedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: payload.adminId,
      action: 'SUPPLIER_DISPUTE_SEQUESTRATED',
      targetId: disputeId,
      ipAddress: '127.0.0.1',
      metadata: {
        supplierId: payload.supplierId,
        disputedAmountInMicrounits: payload.disputedAmountInMicrounits,
        reason: payload.reason,
      },
    });

    return {
      disputeId,
      deliverySlipId: payload.deliverySlipId,
      supplierId: payload.supplierId,
      creditNoteExpectedInMicrounits: payload.disputedAmountInMicrounits,
      sepaPaymentHold: true,
      status: 'opened_pending_credit_note',
      openedAt: Date.now(),
    };
  }
}
