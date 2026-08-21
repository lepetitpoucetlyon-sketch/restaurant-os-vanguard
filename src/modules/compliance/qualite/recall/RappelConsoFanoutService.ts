/**
 * L60 — Veille sanitaire active RappelConso (cross-tenant fanout).
 *
 * Un arrêté préfectoral retire des lots d'huîtres du marché. Le système doit
 * automatiquement croiser le numéro de lot avec tous les tenants qui ont ce
 * produit en stock — et émettre une alerte dans les 15 min.
 *
 * Sans this: 40 TIAC un vendredi soir = fermeture immédiate + mise en cause pénale.
 *
 * Utilise `CrossScopeAuthority` (ADR-014) pour accéder aux stocks cross-tenant.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L60 (CRITIQUE).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface RecallAlert {
  recallId: string;
  productRef: string;
  affectedBatchIds: string[];
  source: 'rappelconso' | 'ddpp' | 'manual';
  severity: 'urgent' | 'high' | 'medium';
  issuedAt: number;
  description: string;
}

export interface TenantRecallImpact {
  tenantId: string;
  matchingBatchIds: string[];
  stockQuantity: number;
}

export interface FanoutResult {
  recallId: string;
  affectedTenants: TenantRecallImpact[];
  broadcastAt: number;
}

export class RappelConsoFanoutService {
  /** Interroge la liste des tenants depuis le registre MCC */
  private static async listTenantIds(): Promise<string[]> {
    const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
    return (tenants ?? []).map(t => t.id).filter(Boolean);
  }

  /** Vérifie si un tenant possède des lots concernés */
  private static async checkTenantStock(
    tenantId: string,
    batchIds: Set<string>,
  ): Promise<TenantRecallImpact | null> {
    const stocks = await Nexus.adapter.query<{ batchId?: string; quantity: number }>(
      `tenants/${tenantId}/stocks`,
    );
    if (!stocks) return null;

    const matchingBatchIds: string[] = [];
    let stockQuantity = 0;

    for (const s of stocks) {
      if (s.batchId && batchIds.has(s.batchId)) {
        matchingBatchIds.push(s.batchId);
        stockQuantity += s.quantity;
      }
    }

    if (!matchingBatchIds.length) return null;
    return { tenantId, matchingBatchIds, stockQuantity };
  }

  static async broadcast(alert: RecallAlert, issuedByUid: string): Promise<FanoutResult> {
    const batchSet = new Set(alert.affectedBatchIds);
    const allTenants = await this.listTenantIds();

    const impacts: TenantRecallImpact[] = [];
    await Promise.all(
      allTenants.map(async tenantId => {
        const impact = await this.checkTenantStock(tenantId, batchSet).catch(() => null);
        if (impact) impacts.push(impact);
      }),
    );

    const broadcastAt = Date.now();

    for (const impact of impacts) {
      await OutboxService.enqueue({
        action: 'CREATE',
        collection: `tenants/${impact.tenantId}/recall_alerts`,
        targetId: `recall_${alert.recallId}_${impact.tenantId}`,
        priority: OutboxPriority.SANITAIRE,
        payload: {
          ...alert,
          tenantId: impact.tenantId,
          matchingBatchIds: impact.matchingBatchIds,
          stockQuantity: impact.stockQuantity,
          broadcastAt,
        },
      }).catch(() => 0);
    }

    await AuditLogger.logAction(
      issuedByUid,
      'RECALL_BROADCAST',
      alert.recallId,
      {
        productRef: alert.productRef,
        affectedBatchCount: alert.affectedBatchIds.length,
        affectedTenantCount: impacts.length,
        severity: alert.severity,
      },
    ).catch(() => null);

    await NexusEventBus.emit('compliance.recall_broadcast', {
      v: 1,
      tenantId: 'mcc',
      recallId: alert.recallId,
      productRef: alert.productRef,
      affectedBatchIds: alert.affectedBatchIds,
      affectedTenantCount: impacts.length,
      broadcastAt,
    });

    return { recallId: alert.recallId, affectedTenants: impacts, broadcastAt };
  }
}
