/**
 * ProactiveInsightHandler (§7)
 *
 * Surveille les événements opérationnels clés et émet `intelligence.insight_ready`
 * quand un seuil est franchi. L'IA reste en mode push — pas de sollicitation.
 *
 * Seuils définis ici ; TODO §10 : lire depuis tenants/{id}/config/insights
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const WASTE_ALERT_THRESHOLD_MICROUNITS = 50_000_000; // 50 €

interface InsightRecord {
  id: string;
  tenantId: string;
  trigger: string;
  message: string;
  actionType: 'review_menu' | 'adjust_stock' | 'activate_sms' | 'create_draft_order' | 'general';
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

async function emitInsight(
  tenantId: string,
  trigger: string,
  message: string,
  actionType: InsightRecord['actionType'],
  metadata: Record<string, unknown>,
): Promise<void> {
  const id = Nexus.adapter.generateId(`tenants/${tenantId}/insights`);
  const record: InsightRecord = {
    id, tenantId, trigger, message, actionType, metadata,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await Nexus.adapter.set(`tenants/${tenantId}/insights/${id}`, record);

  await NexusEventBus.emitDurable('intelligence.insight_ready', {
    v: 1,
    tenantId,
    insightId: id,
    trigger,
    actionType,
  });

  logger.info(`[ProactiveInsight] ${trigger} → insight ${id} pour tenant ${tenantId}`);
}

export function registerProactiveInsightHandler(): Array<() => void> {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    NexusEventBus.on('finance.food_cost_impacted', async ({ tenantId, reason, affectedItems }) => {
      await emitInsight(
        tenantId,
        'food_cost_impacted',
        `Coût matière impacté (${reason}). Vérifiez les prix de vente des ${affectedItems?.length ?? 0} produit(s) concerné(s).`,
        'review_menu',
        { reason, affectedItems },
      );
    }, { id: 'proactive-insight-food-cost', priority: 'BACKGROUND' }),
  );

  unsubs.push(
    NexusEventBus.on('ops.waste_validated', async ({ tenantId, wasteAmountInMicrounits, items }) => {
      if ((wasteAmountInMicrounits ?? 0) < WASTE_ALERT_THRESHOLD_MICROUNITS) return;
      await emitInsight(
        tenantId,
        'waste_threshold_crossed',
        `Gaspillage important détecté (${Math.round((wasteAmountInMicrounits ?? 0) / 1_000_000)}€). Révision du planning des commandes recommandée.`,
        'adjust_stock',
        { wasteAmountInMicrounits, itemCount: Array.isArray(items) ? items.length : 0 },
      );
    }, { id: 'proactive-insight-waste', priority: 'BACKGROUND' }),
  );

  unsubs.push(
    NexusEventBus.on('inventory.stock_adjusted', async ({ tenantId, itemId, newQuantity }) => {
      if ((newQuantity ?? 0) > 0) return;
      await emitInsight(
        tenantId,
        'stock_zero',
        `Stock nul pour l'article ${itemId}. Un bon de commande automatique a été déclenché si un seuil est configuré.`,
        'create_draft_order',
        { itemId, newQuantity },
      );
    }, { id: 'proactive-insight-stock-zero', priority: 'BACKGROUND' }),
  );

  return unsubs;
}
