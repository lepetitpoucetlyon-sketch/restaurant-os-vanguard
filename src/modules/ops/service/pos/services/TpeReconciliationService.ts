/**
 * L42 — Réconciliation TPE avant re-débit.
 *
 * Quand un paiement TPE reste "En attente" (timeout réseau, coupure GSM),
 * un second débit est déclenché par le serveur. Or la banque a déjà capturé
 * le premier — le client est débité deux fois. Risque de chargeback + litige.
 *
 * Solution : avant tout re-débit, interroger le journal transactionnel TPE
 * local (stocké en Nexus offline) et bloquer si le statut est déjà 'captured'.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L42 (CRITIQUE — double débit).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export type TpeTransactionStatus = 'captured' | 'pending' | 'failed' | 'unknown';

export interface TpeTransactionRecord {
  transactionId: string;
  orderId: string;
  tenantId: string;
  amountInMicrounits: number;
  status: TpeTransactionStatus;
  terminalId: string;
  capturedAt?: number;
  updatedAt: number;
}

export interface ReconciliationResult {
  safe: boolean;
  status: TpeTransactionStatus;
  transactionId?: string;
  reason?: 'already_captured' | 'state_unknown';
}

export class TpeReconciliationService {
  private static path(tenantId: string, transactionId: string): string {
    return `tenants/${tenantId}/tpe_transactions/${transactionId}`;
  }

  static async checkBeforeRedebit(input: {
    tenantId: string;
    orderId: string;
    tpeTransactionId: string;
    operatorId: string;
    now?: number;
  }): Promise<ReconciliationResult> {
    const now = input.now ?? Date.now();
    const record = await Nexus.adapter.get<TpeTransactionRecord>(
      this.path(input.tenantId, input.tpeTransactionId),
    );

    if (!record) {
      return { safe: false, status: 'unknown', reason: 'state_unknown' };
    }

    if (record.status === 'captured') {
      await NexusEventBus.emit('finance.tpe_reconciliation_blocked', {
        v: 1,
        tenantId: input.tenantId,
        orderId: input.orderId,
        tpeTransactionId: input.tpeTransactionId,
        tpeStatus: record.status,
        blockedAt: now,
      });
      await AuditLogger.logAction(
        input.operatorId,
        'TPE_REDEBIT_BLOCKED',
        input.orderId,
        { tpeTransactionId: input.tpeTransactionId, status: record.status },
      ).catch(() => null);
      return { safe: false, status: 'captured', transactionId: record.transactionId, reason: 'already_captured' };
    }

    return { safe: true, status: record.status, transactionId: record.transactionId };
  }

  static async recordTransaction(record: TpeTransactionRecord): Promise<void> {
    await Nexus.adapter.set(this.path(record.tenantId, record.transactionId), record);
  }

  static async updateStatus(
    tenantId: string,
    transactionId: string,
    status: TpeTransactionStatus,
    now?: number,
  ): Promise<void> {
    const existing = await Nexus.adapter.get<TpeTransactionRecord>(this.path(tenantId, transactionId));
    if (!existing) return;
    await Nexus.adapter.set(this.path(tenantId, transactionId), {
      ...existing,
      status,
      updatedAt: now ?? Date.now(),
      ...(status === 'captured' ? { capturedAt: now ?? Date.now() } : {}),
    });
  }
}
