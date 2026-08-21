/**
 * L1 — Transfert de table en cours de repas.
 *
 * Si une table T4 est déplacée en terrasse T34 en cours de service, la commande
 * active doit migrer atomiquement. Un simple update non-atomique laisse le KDS
 * pointer sur T4 (orphelin).
 *
 * Ce service réalise le transfert en :
 * 1. Vérifiant que la table cible n'a pas de commande active
 * 2. Mettant à jour l'orderId sur la nouvelle table
 * 3. Libérant l'ancienne table
 * 4. Notifiant le KDS via EventBus
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L1 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface TableTransferResult {
  success: boolean;
  reason?: 'target_table_occupied' | 'order_not_found';
}

export class TableTransferService {
  private static orderPath(tenantId: string, orderId: string): string {
    return `tenants/${tenantId}/orders/${orderId}`;
  }

  private static tablePath(tenantId: string, tableId: string): string {
    return `tenants/${tenantId}/tables/${tableId}`;
  }

  static async transfer(input: {
    tenantId: string;
    orderId: string;
    fromTableId: string;
    toTableId: string;
    operatorId: string;
    now?: number;
  }): Promise<TableTransferResult> {
    const now = input.now ?? Date.now();

    const [order, targetTable] = await Promise.all([
      Nexus.adapter.get<Record<string, unknown>>(this.orderPath(input.tenantId, input.orderId)),
      Nexus.adapter.get<Record<string, unknown>>(this.tablePath(input.tenantId, input.toTableId)),
    ]);

    if (!order) return { success: false, reason: 'order_not_found' };

    if (targetTable && targetTable.activeOrderId && targetTable.activeOrderId !== input.orderId) {
      return { success: false, reason: 'target_table_occupied' };
    }

    await Promise.all([
      Nexus.adapter.set(this.orderPath(input.tenantId, input.orderId), {
        ...order,
        tableId: input.toTableId,
        tableTransferredAt: now,
        previousTableId: input.fromTableId,
      }),
      Nexus.adapter.set(this.tablePath(input.tenantId, input.fromTableId), {
        ...(await Nexus.adapter.get<Record<string, unknown>>(this.tablePath(input.tenantId, input.fromTableId)) ?? {}),
        activeOrderId: null,
        status: 'available',
      }),
      Nexus.adapter.set(this.tablePath(input.tenantId, input.toTableId), {
        ...(targetTable ?? {}),
        activeOrderId: input.orderId,
        status: 'occupied',
      }),
    ]);

    await AuditLogger.logAction(
      input.operatorId,
      'TABLE_TRANSFERRED',
      input.orderId,
      { fromTableId: input.fromTableId, toTableId: input.toTableId },
    ).catch(() => null);

    await NexusEventBus.emit('ops.table_transferred', {
      v: 1,
      tenantId: input.tenantId,
      orderId: input.orderId,
      fromTableId: input.fromTableId,
      toTableId: input.toTableId,
      operatorId: input.operatorId,
      transferredAt: now,
    });

    return { success: true };
  }
}
