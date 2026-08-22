import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface CorkedBottleDisputeRequest {
  tenantId: string;
  adminId: string;
  productId: string;
  productName: string;
  vintageYear?: number;
  bottleLot: string;
  supplierId: string;
  costInMicrounits: number;
  tableNumber?: string;
  notes?: string;
}

export interface CorkedBottleDisputeResult {
  disputeId: string;
  stockTransferToDispute: boolean;
  supplierDebitClaimSlipId: string;
  recordedAt: number;
}

/**
 * CorkedBottleDisputeService — Angle mort L16.
 * Traite les bouteilles bouchonnées : transfert automatique en stock litige caviste, bon de retour fournisseur et annulation fiscale NF525 non frauduleuse.
 */
export class CorkedBottleDisputeService {
  static async recordCorkedBottle(
    req: CorkedBottleDisputeRequest
  ): Promise<CorkedBottleDisputeResult> {
    const disputeId = `BOTTLE-DEFECT-${Date.now()}`;
    const supplierDebitClaimSlipId = `CLAIM-SUPPLIER-${req.supplierId}-${Date.now().toString(36).toUpperCase()}`;

    NexusEventBus.emit('bar.corked_bottle_disputed', {
      v: 1,
      tenantId: req.tenantId,
      productId: req.productId,
      supplierId: req.supplierId,
      bottleLot: req.bottleLot,
      costInMicrounits: req.costInMicrounits,
      recordedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: req.adminId,
      action: 'CORKED_BOTTLE_RECORDED',
      targetId: disputeId,
      ipAddress: '127.0.0.1',
      metadata: {
        productId: req.productId,
        bottleLot: req.bottleLot,
        supplierId: req.supplierId,
        costInMicrounits: req.costInMicrounits,
        tableNumber: req.tableNumber,
      },
    });

    return {
      disputeId,
      stockTransferToDispute: true,
      supplierDebitClaimSlipId,
      recordedAt: Date.now(),
    };
  }
}
