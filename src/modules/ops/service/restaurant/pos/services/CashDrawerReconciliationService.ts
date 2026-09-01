import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface CashDenominationCount {
  denominationInMicrounits: number; // ex: 50_000_000 for 50€
  count: number;
}

export interface CashReconciliationInput {
  tenantId: string;
  adminId: string;
  sessionDateIso: string;
  openingFloatInMicrounits: number; // Fond de caisse ouverture (J-1 -> J)
  cashSalesInMicrounits: number; // Ventes espèces théoriques
  cashRefundsInMicrounits?: number; // Remboursements espèces
  cashDropInMicrounits?: number; // Prélèvements coffre
  countedDenominations: CashDenominationCount[];
  notes?: string;
}

export interface CashReconciliationResult {
  sessionDateIso: string;
  openingFloatInMicrounits: number;
  expectedCashInMicrounits: number;
  countedCashInMicrounits: number;
  varianceInMicrounits: number; // >0 excédent, <0 déficit
  varianceStatus: 'balanced' | 'surplus' | 'shortage';
  isAcceptable: boolean; // variance <= 2€ (2_000_000 microunits)
  reconciledAt: number;
}

/**
 * CashDrawerReconciliationService — Angle mort A4.
 * Gère le workflow de contrôle de caisse :
 * Fond de caisse ouverture, contrôle au billet/pièce près, réconciliation théorique vs réel et calcul de variance.
 */
export class CashDrawerReconciliationService {
  private static readonly ACCEPTABLE_TOLERANCE_MICROUNITS = 2_000_000; // 2.00 €

  static async reconcile(input: CashReconciliationInput): Promise<CashReconciliationResult> {
    const refunds = input.cashRefundsInMicrounits || 0;
    const drops = input.cashDropInMicrounits || 0;

    // Expected = Float + Cash Sales - Refunds - Drops
    const expectedCashInMicrounits = input.openingFloatInMicrounits + input.cashSalesInMicrounits - refunds - drops;

    // Counted = sum of denomination * count
    const countedCashInMicrounits = input.countedDenominations.reduce((sum, item) => {
      if (item.count < 0 || item.denominationInMicrounits < 0) {
        throw new Error('[CASH-RECON] Denomination and count cannot be negative');
      }
      return sum + (item.denominationInMicrounits * item.count);
    }, 0);

    const varianceInMicrounits = countedCashInMicrounits - expectedCashInMicrounits;

    let varianceStatus: 'balanced' | 'surplus' | 'shortage' = 'balanced';
    if (varianceInMicrounits > 0) varianceStatus = 'surplus';
    else if (varianceInMicrounits < 0) varianceStatus = 'shortage';

    const isAcceptable = Math.abs(varianceInMicrounits) <= this.ACCEPTABLE_TOLERANCE_MICROUNITS;

    // Publish event
    NexusEventBus.emit('pos.cash_drawer_reconciled', {
      v: 1,
      tenantId: input.tenantId,
      expectedCashInMicrounits,
      countedCashInMicrounits,
      varianceInMicrounits,
      sessionDateIso: input.sessionDateIso,
      reconciledAt: Date.now(),
    });

    // Audit log if significant variance
    if (!isAcceptable) {
      await AuditLogger.logAction({
        adminId: input.adminId,
        action: 'CASH_DRAWER_VARIANCE',
        targetId: `DRAWER-${input.sessionDateIso}`,
        ipAddress: '127.0.0.1',
        metadata: {
          sessionDateIso: input.sessionDateIso,
          varianceInMicrounits,
          varianceStatus,
        },
      });
    }

    return {
      sessionDateIso: input.sessionDateIso,
      openingFloatInMicrounits: input.openingFloatInMicrounits,
      expectedCashInMicrounits,
      countedCashInMicrounits,
      varianceInMicrounits,
      varianceStatus,
      isAcceptable,
      reconciledAt: Date.now(),
    };
  }
}
