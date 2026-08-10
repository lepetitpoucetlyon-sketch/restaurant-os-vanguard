import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * Persiste les alertes de stock bas dans `stockAlerts/{tenantId}/{itemId}`
 * et loggue en critique pour déclenchement de réassort.
 */
export function registerStockAlertHandler(): () => void {
    return NexusEventBus.on(
        'stock.low',
        async ({ tenantId, itemId, itemName, currentQuantity, threshold }) => {
            const alertPath = `tenants/${tenantId}/stockAlerts/${itemId}`;

            await Nexus.adapter.set(alertPath, {
                itemId,
                itemName,
                currentQuantity,
                threshold,
                triggeredAt: new Date().toISOString(),
                status: 'PENDING',
            });

            logger.warn(`[StockAlert] Stock bas — ${itemName} (${currentQuantity}/${threshold})`, {
                tenantId,
                itemId,
            });

            if (currentQuantity <= 0) {
                // P11-G: Produit rupture -> retiré KDS/POS
                await Nexus.adapter.update(`tenants/${tenantId}/products/${itemId}`, {
                    available: false,
                    stockZeroAt: new Date().toISOString()
                });
            }

            empireAudit.log({
                module: 'inventory',
                action: 'STOCK_ALERT_TRIGGERED',
                details: { itemId, itemName, currentQuantity, threshold },
                severity: 'medium',
                timestamp: new Date(),
            });
        },
        { id: 'stock-alert', priority: 'HIGH' }
    );
}
