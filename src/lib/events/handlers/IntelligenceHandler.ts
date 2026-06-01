import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * Analyse intelligente BACKGROUND après chaque paiement.
 * Lance en parallèle : analyse stock prédictive + signaux d'alerte.
 * BACKGROUND : fire-and-forget, jamais bloquant.
 */
export function registerIntelligenceHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, items, totalInMicrounits }) => {
      // Multiple inférence en parallèle
      await Promise.allSettled([
        analyzeStockTrend(tenantId, items),
        analyzeRevenueSignal(tenantId, totalInMicrounits),
      ]);
    },
    { id: 'intelligence-analysis', priority: 'BACKGROUND' }
  );
}

async function analyzeStockTrend(tenantId: string, items: any[]): Promise<void> {
  try {
    // Lecture ZCPO state pour savoir si on peut faire une inférence lourde
    const zcpoState = await readZcpoState();
    if (zcpoState?.memoryPressure === 'critical') return; // machine sous pression

    const highVelocityItems = items.filter(i => i.quantity >= 3);
    if (highVelocityItems.length === 0) return;

    logger.info(
      `[Intelligence] Stock trend — articles haute vélocité : ${highVelocityItems.map(i => i.name).join(', ')}`
    );
    // TODO: appel HermesKnowledgeManager.query() pour prédiction réappro
  } catch (err) {
    logger.warn('[Intelligence] analyzeStockTrend failed', err);
  }
}

async function analyzeRevenueSignal(tenantId: string, totalInMicrounits: number): Promise<void> {
  try {
    logger.info(
      `[Intelligence] Revenue signal — ticket ${(totalInMicrounits / 1_000_000).toFixed(2)}€`
    );
    // TODO: comparer avec moyenne glissante, émettre alerte si écart > 2σ
  } catch (err) {
    logger.warn('[Intelligence] analyzeRevenueSignal failed', err);
  }
}

/**
 * Lit zcpo_state.json si disponible (env serveur uniquement).
 * Retourne null en environnement browser ou si ZCPO n'est pas actif.
 */
async function readZcpoState(): Promise<{ memoryPressure: string; idleSeconds: number; isVetoActive: boolean } | null> {
  if (typeof window !== 'undefined') return null; // browser → skip
  try {
    const { readFile } = await import('fs/promises');
    const home = process.env.HOME ?? '/Users/' + process.env.USER;
    const raw = await readFile(`${home}/Library/Application Support/ZCPO/zcpo_state.json`, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
