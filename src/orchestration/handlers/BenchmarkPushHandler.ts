/**
 * BenchmarkPushHandler (§17)
 *
 * Abonné à `finance.ticket_z_closed` — si le tenant a activé l'opt-in benchmark,
 * pousse une contribution anonymisée vers `benchmarks/{vertical}/{segment}/{date}`.
 *
 * Règle absolue :
 * - Aucune donnée client ni nominative dans la contribution
 * - Pas de tenantId dans les agrégats publics
 * - TTL 90j géré côté Firestore (TTL policy sur `expiresAt`)
 * - Min 5 contributions par segment avant calcul de médiane (côté lecteur)
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface TicketZClosedPayload {
  tenantId: string;
  date: string;
  totalTTCInMicrounits?: number;
  coverCount?: number;
  averageTicketInMicrounits?: number;
  noShowRate?: number;
  foodCostRatio?: number;
}

interface BenchmarkContribution {
  segment: string;
  vertical: string;
  date: string;
  averageTicketInMicrounits: number;
  coverCount: number;
  occupancyRate: number;
  foodCostRatio: number;
  noShowRate: number;
  contributedAt: string;
  expiresAt: string;
}

async function getTenantMeta(tenantId: string): Promise<{
  vertical: string;
  segment: string;
  benchmarkOptIn: boolean;
} | null> {
  const config = await Nexus.adapter.get<{
    variant?: string;
    benchmarkOptIn?: boolean;
    segment?: string;
  }>(`tenants/${tenantId}/tenantConfig`);

  if (!config || !config.benchmarkOptIn) return null;

  return {
    vertical: config.variant ?? 'restaurant',
    segment: config.segment ?? 'general',
    benchmarkOptIn: true,
  };
}

export function registerBenchmarkPushHandler(): () => void {
  return NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload: TicketZClosedPayload) => {
      const { tenantId, date } = payload;

      try {
        const meta = await getTenantMeta(tenantId);
        if (!meta) return;

        const contribution: BenchmarkContribution = {
          segment: meta.segment,
          vertical: meta.vertical,
          date,
          averageTicketInMicrounits: payload.averageTicketInMicrounits ?? 0,
          coverCount: payload.coverCount ?? 0,
          occupancyRate: 0,
          foodCostRatio: payload.foodCostRatio ?? 0,
          noShowRate: payload.noShowRate ?? 0,
          contributedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const contribPath = `benchmarks/${meta.vertical}/${meta.segment}/${date}`;
        const id = Nexus.adapter.generateId(contribPath);
        await Nexus.adapter.set(`${contribPath}/${id}`, contribution);

        logger.info(`[Benchmark] Contribution ${id} envoyée pour ${meta.vertical}/${meta.segment}/${date}`);
      } catch (err) {
        logger.error('[BenchmarkPush] Erreur contribution', err);
      }
    },
    { id: 'benchmark-push-handler', priority: 'BACKGROUND' },
  );
}
