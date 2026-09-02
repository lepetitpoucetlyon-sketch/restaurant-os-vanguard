import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { formatMu } from '@/lib/formatters';

const SPLIT_LABELS: Record<string, string> = {
  equipartition: 'parts égales',
  by_item: 'par article',
  percentage: 'au pourcentage',
  custom: 'personnalisé',
};

/**
 * SplitBillRegisteredHandler
 * Le convive a préparé son partage d'addition depuis son smartphone
 * (`TableSplitBillModal` → `POST /api/v1/orders/[id]/split-bill`). On prévient
 * la salle pour qu'un serveur apporte le terminal / encaisse chaque part au POS.
 * Le règlement lui-même reste au POS — cet event ne solde rien.
 */
export function registerSplitBillRegisteredHandler(): () => void {
  return NexusEventBus.on(
    'pos.split_bill_processed',
    async (payload) => {
      const { tenantId, orderId, splitType, partsCount, totalInMicrounits } = payload;
      const label = SPLIT_LABELS[splitType] ?? splitType;
      const message = `Commande ${String(orderId).slice(-6).toUpperCase()} : partage ${label} en ${partsCount} — total ${formatMu(totalInMicrounits)}. Apporter le terminal.`;

      logger.info(`[SplitBillRegisteredHandler] ${message} (tenant ${tenantId})`);

      await NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: crypto.randomUUID(),
        type: 'info',
        title: "Partage d'addition préparé",
        message,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'split-bill-registered-handler', priority: 'HIGH' },
  );
}
