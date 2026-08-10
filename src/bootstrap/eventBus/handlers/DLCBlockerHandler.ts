/**
 * DLCBlockerHandler — I1 : HACCP → POS
 *
 * Quand une DLC expire (`dlc.expired`), bloque le produit dans le catalogue POS
 * en ajoutant un flag `blockedUntilRestocked: true` + raison `dlc_expired`.
 * Le handler DLCExpiryHandler (compliance) gère la déduction stock — ce handler
 * gère l'aspect VENTE (blocage dans le catalogue).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerDLCBlockerHandler(): () => void {
  return NexusEventBus.on(
    'dlc.expired',
    async (payload) => {
      const { tenantId, itemId, batchNumber, quantity } = payload;

      try {
        // Chercher le produit POS associé à ce stockItem
        const productPath = `tenants/${tenantId}/products/${itemId}`;
        const product = await Nexus.adapter.get<{ name?: string; blocked?: boolean }>(productPath);

        if (product) {
          await Nexus.adapter.update(productPath, {
            blocked: true,
            blockedReason: 'dlc_expired',
            blockedBatch: batchNumber,
            blockedAt: Date.now(),
          });

          logger.warn(
            `[DLCBlocker] Produit ${itemId} bloqué POS — DLC expirée (Lot: ${batchNumber}, qté: ${quantity})`
          );

          empireAudit.log({
            module: 'compliance',
            action: 'DLC_PRODUCT_BLOCKED_POS',
            details: { itemId, batchNumber, quantity, productName: product.name },
            severity: 'high',
            timestamp: new Date(),
          });
        } else {
          // L'itemId peut être un stockItem sans correspondance directe produit POS —
          // on log uniquement, pas d'erreur bloquante
          logger.info(
            `[DLCBlocker] Pas de produit POS trouvé pour stockItem ${itemId} — skip blocage.`
          );
        }
      } catch (err) {
        logger.error('[DLCBlocker] Erreur lors du blocage POS', err);
        throw err; // remonte dans la DLQ
      }
    },
    { id: 'dlc-blocker-pos', priority: 'HIGH' }
  );
}
