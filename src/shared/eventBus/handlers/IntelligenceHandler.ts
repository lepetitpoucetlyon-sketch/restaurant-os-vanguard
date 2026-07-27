import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { HermesKnowledgeManager } from '@/modules/intelligence/rag/HermesKnowledgeManager';

/**
 * Analyse intelligente BACKGROUND après chaque paiement.
 * Lance en parallèle : analyse stock prédictive + signaux d'alerte.
 * BACKGROUND : fire-and-forget, jamais bloquant.
 */
export function registerIntelligenceHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, items, totalInMicrounits }) => {
      await Promise.allSettled([
        analyzeStockTrend(tenantId, items),
        analyzeRevenueSignal(tenantId, totalInMicrounits),
      ]);
    },
    { id: 'intelligence-analysis', priority: 'BACKGROUND' }
  );
}

async function analyzeStockTrend(tenantId: string, items: import("@/modules/ops/engine/types").CartItem[]): Promise<void> {
  try {
    const zcpoState = await readZcpoState();
    if (zcpoState?.memoryPressure === 'critical') return;

    const highVelocityItems = items.filter(i => i.quantity >= 3);
    if (highVelocityItems.length === 0) return;

    const names = highVelocityItems.map((i) => i.name).join(', ');
    const hermes = new HermesKnowledgeManager(tenantId, {
      region: 'FR',
      cuisineType: 'unknown',
      sizeBand: 'small',
      priceBand: 'mid_range',
    });

    const answer = await hermes.query({
      question: `Les articles "${names}" sont commandés en grande quantité. Quel est le risque de rupture de stock et quelle quantité faut-il réapprovisionner ?`,
      focusTypes: ['product', 'supplier'],
    });

    logger.info(`[Intelligence] Stock trend — ${names} → ${answer.answer.slice(0, 120)}`);
  } catch (err) {
    logger.warn('[Intelligence] analyzeStockTrend failed', String(err));
  }
}

interface TicketZDoc {
  totalInMicrounits: number;
  ordersCount: number;
}

async function analyzeRevenueSignal(tenantId: string, totalInMicrounits: number): Promise<void> {
  try {
    // Lire les 7 derniers jours de TicketZ pour calculer moyenne + écart-type
    const today = new Date();
    const samples: number[] = [];

    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const doc = await Nexus.adapter.get<TicketZDoc>(`tenants/${tenantId}/ticketZ/${dateStr}`);
      if (doc && doc.ordersCount > 0) {
        // Ticket moyen du jour
        samples.push(doc.totalInMicrounits / doc.ordersCount);
      }
    }

    if (samples.length < 3) {
      logger.info(`[Intelligence] Revenue signal — pas assez d'historique (${samples.length} jours)`);
      return;
    }

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const sigma = Math.sqrt(variance);
    const zScore = sigma > 0 ? (totalInMicrounits - mean) / sigma : 0;

    const ticketEur = (totalInMicrounits / 1_000_000).toFixed(2);
    const meanEur = (mean / 1_000_000).toFixed(2);

    if (Math.abs(zScore) > 2) {
      const direction = zScore > 0 ? 'exceptionnellement élevé' : 'exceptionnellement bas';
      logger.warn(
        `[Intelligence] Alerte revenue — ticket ${ticketEur}€ ${direction} (moyenne 7j: ${meanEur}€, z=${zScore.toFixed(2)})`
      );
    } else {
      logger.info(
        `[Intelligence] Revenue signal — ticket ${ticketEur}€ (moyenne 7j: ${meanEur}€, z=${zScore.toFixed(2)})`
      );
    }
  } catch (err) {
    logger.warn('[Intelligence] analyzeRevenueSignal failed', String(err));
  }
}

async function readZcpoState(): Promise<{ memoryPressure: string; idleSeconds: number; isVetoActive: boolean } | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { readFile } = await import('fs/promises');
    const home = process.env.HOME ?? '/Users/' + process.env.USER;
    const raw = await readFile(`${home}/Library/Application Support/ZCPO/zcpo_state.json`, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
