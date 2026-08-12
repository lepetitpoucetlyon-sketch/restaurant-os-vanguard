import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface OrderRecord {
  status: string;
  totalInMicrounits?: number;
  covers?: number;
}

/**
 * DailyDigestJob (P0-2.5)
 * Se déclenche chaque soir à 23h00.
 * Calcule et émet le bilan quotidien d'exploitation `finance.daily_audit`.
 */
export const DailyDigestJob = {
  name: 'DailyDigestJob',
  schedule: '0 23 * * *', // 23h00 chaque soir
  async runForTenant(tenantId: string): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Récupérer les commandes du jour
      const orders = await Nexus.adapter.query<OrderRecord>(`tenants/${tenantId}/orders`);
      const paidOrders = orders.filter((o: OrderRecord) => o.status === 'paid' || o.status === 'completed');

      const totalRevenueInMicrounits = paidOrders.reduce((acc: number, o: OrderRecord) => acc + (o.totalInMicrounits ?? 0), 0);
      const totalCovers = paidOrders.reduce((acc: number, o: OrderRecord) => acc + (o.covers ?? 1), 0);

      logger.info(`[DailyDigestJob] Génération du digest quotidien pour tenant ${tenantId} (${(totalRevenueInMicrounits / 1_000_000).toFixed(2)}€, ${totalCovers} couverts)`);

      await NexusEventBus.emitDurable('finance.daily_audit', {
        v: 1,
        tenantId,
        date: todayStr,
      });
    } catch (err) {
      logger.error(`[DailyDigestJob] Échec de génération du digest quotidien pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
