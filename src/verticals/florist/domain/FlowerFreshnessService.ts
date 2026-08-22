import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { IFlowerArrangement, IFlowerLot, IFreshnessReport, IFlowerDelivery } from './types';

/**
 * FlowerFreshnessService — logique métier propre à la verticale fleuriste.
 * Fraîcheur du stock périssable (durée de vie courte) + compositions + livraisons.
 */
export const FlowerFreshnessService = {
  async listArrangements(tenantId: string): Promise<IFlowerArrangement[]> {
    return Nexus.adapter.query<IFlowerArrangement>(`tenants/${tenantId}/flowerArrangements`, { limit: 200 });
  },

  async listLots(tenantId: string): Promise<IFlowerLot[]> {
    return Nexus.adapter.query<IFlowerLot>(`tenants/${tenantId}/flowerLots`, { limit: 200 });
  },

  async computeFreshnessReport(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IFreshnessReport> {
    const lots = (await this.listLots(tenantId)).filter(
      l => l.receivedAt >= periodStart && l.receivedAt <= periodEnd
    );

    const totalLots = lots.length;
    const freshCount = lots.filter(l => l.status === 'fresh').length;
    const expiringSoonCount = lots.filter(l => l.status === 'expiring-soon').length;
    const wiltedCount = lots.filter(l => l.status === 'wilted' || l.status === 'discarded').length;
    const wastageRatePct = totalLots > 0 ? (wiltedCount / totalLots) * 100 : 0;

    return { periodStart, periodEnd, totalLots, freshCount, expiringSoonCount, wiltedCount, wastageRatePct };
  },

  async listDeliveries(tenantId: string): Promise<IFlowerDelivery[]> {
    return Nexus.adapter.query<IFlowerDelivery>(`tenants/${tenantId}/flowerDeliveries`, {
      where: [{ field: 'status', operator: '!=', value: 'delivered' }],
      limit: 100,
    });
  },
};
