/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { HermesKnowledgeManager } from '@/modules/intelligence';

import type { CartItem } from '@/modules/ops/workflow/engine/types';
import { toError } from "@/lib/toError";

/**
 * Analyse intelligente BACKGROUND après chaque paiement.
 * Lance en parallèle : analyse stock prédictive + signaux d'alerte.
 * BACKGROUND : fire-and-forget, jamais bloquant.
 * P2: Coalescence (debounce) sur 30s pour limiter la charge LLM.
 */

interface PendingIntelligenceEvent {
  tenantId: string;
  items: CartItem[];
  totalInMicrounits: number;
}

let eventBuffer: PendingIntelligenceEvent[] = [];
let debounceTimeout: NodeJS.Timeout | null = null;

export function registerIntelligenceHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    (payload) => {
      eventBuffer.push({
        tenantId: payload.tenantId,
        items: payload.items,
        totalInMicrounits: payload.totalInMicrounits,
      });

      if (!debounceTimeout) {
        debounceTimeout = setTimeout(async () => {
          const batch = [...eventBuffer];
          eventBuffer = [];
          debounceTimeout = null;

          try {
            const byTenant = new Map<string, { items: CartItem[]; totals: number[] }>();
            for (const ev of batch) {
              const existing = byTenant.get(ev.tenantId) ?? { items: [], totals: [] };
              existing.items.push(...ev.items);
              existing.totals.push(ev.totalInMicrounits);
              byTenant.set(ev.tenantId, existing);
            }

            for (const [tenantId, agg] of byTenant.entries()) {
              const promises: Promise<void>[] = [
                analyzeStockTrend(tenantId, agg.items),
              ];
              for (const t of agg.totals) {
                promises.push(analyzeRevenueSignal(tenantId, t));
              }
              await Promise.allSettled(promises);
            }
          } catch (e) {
            logger.error('[Intelligence] Batch processing failed', e);
          }
        }, 30_000);
      }
    },
    { id: 'intelligence-analysis', priority: 'BACKGROUND' }
  );
}

async function analyzeStockTrend(tenantId: string, items: import("@/modules/ops/workflow/engine/types").CartItem[]): Promise<void> {
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
    logger.warn('[Intelligence] analyzeStockTrend failed', toError(err).message);
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
      NexusEventBus.emitDurable('anomaly.detected', {
        v: 1,
        tenantId,
        type: 'revenue_zscore',
        message: `Ticket ${ticketEur}€ ${direction}`,
        zScore,
        metadata: { meanEur, ticketEur }
      }).catch(() => {});
    } else {
      logger.info(
        `[Intelligence] Revenue signal — ticket ${ticketEur}€ (moyenne 7j: ${meanEur}€, z=${zScore.toFixed(2)})`
      );
    }
  } catch (err) {
    logger.warn('[Intelligence] analyzeRevenueSignal failed', toError(err).message);
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
