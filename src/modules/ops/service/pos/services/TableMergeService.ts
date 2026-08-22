/**
 * L2 — Fusion de tables (T4+T5 en cours de service).
 *
 * Un groupe qui commence sur T4 puis réclame T5 pour s'agrandir : les deux
 * commandes doivent être fusionnées en un seul ticket sous la table primaire.
 * T5 est libérée physiquement.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L2 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface MergeResult {
  success: boolean;
  mergedOrderId?: string;
  reason?: 'primary_order_not_found' | 'secondary_order_not_found';
}

export class TableMergeService {
  static async merge(input: {
    tenantId: string;
    primaryTableId: string;
    primaryOrderId: string;
    secondaryTableId: string;
    secondaryOrderId: string;
    operatorId: string;
    now?: number;
  }): Promise<MergeResult> {
    const now = input.now ?? Date.now();

    const [primary, secondary] = await Promise.all([
      Nexus.adapter.get<Record<string, unknown>>(`tenants/${input.tenantId}/orders/${input.primaryOrderId}`),
      Nexus.adapter.get<Record<string, unknown>>(`tenants/${input.tenantId}/orders/${input.secondaryOrderId}`),
    ]);

    if (!primary) return { success: false, reason: 'primary_order_not_found' };
    if (!secondary) return { success: false, reason: 'secondary_order_not_found' };

    const primaryItems = (primary.items as unknown[]) ?? [];
    const secondaryItems = (secondary.items as unknown[]) ?? [];
    const mergedItems = [...primaryItems, ...secondaryItems];

    await Promise.all([
      Nexus.adapter.set(`tenants/${input.tenantId}/orders/${input.primaryOrderId}`, {
        ...primary,
        items: mergedItems,
        mergedFromOrderId: input.secondaryOrderId,
        mergedAt: now,
        tableIds: [input.primaryTableId, input.secondaryTableId],
      }),
      Nexus.adapter.set(`tenants/${input.tenantId}/orders/${input.secondaryOrderId}`, {
        ...secondary,
        status: 'merged_into',
        mergedIntoOrderId: input.primaryOrderId,
        mergedAt: now,
      }),
      Nexus.adapter.set(`tenants/${input.tenantId}/tables/${input.secondaryTableId}`, {
        activeOrderId: null,
        status: 'available',
        mergedIntoTableId: input.primaryTableId,
      }),
    ]);

    await AuditLogger.logAction(
      input.operatorId,
      'TABLES_MERGED',
      input.primaryOrderId,
      { secondaryTableId: input.secondaryTableId, secondaryOrderId: input.secondaryOrderId },
    ).catch(() => null);

    await NexusEventBus.emit('ops.tables_merged', {
      v: 1,
      tenantId: input.tenantId,
      primaryTableId: input.primaryTableId,
      secondaryTableId: input.secondaryTableId,
      mergedOrderId: input.primaryOrderId,
      operatorId: input.operatorId,
      mergedAt: now,
    });

    return { success: true, mergedOrderId: input.primaryOrderId };
  }
}
