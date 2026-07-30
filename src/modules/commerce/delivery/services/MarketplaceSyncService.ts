import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { SharedKernel } from '@/shared/nexus/contracts/SharedKernel';

export interface MarketplaceOrderPayload {
    platform: 'ubereats' | 'deliveroo' | 'wolt';
    externalOrderId: string;
    items: Array<{ id: string; quantity: number; priceInCents: number }>;
    totalInCents: number;
    commissionInCents: number;
}

/**
 * 🛵 C5.5: Marketplace Sync Service
 * Ingestion des commandes UberEats/Deliveroo et calcul de la commission comptable.
 */
export class MarketplaceSyncService {
    
    /**
     * Reçoit un Webhook d'une plateforme de livraison et l'injecte dans le système.
     */
    static async handleIncomingOrder(tenantId: string, payload: MarketplaceOrderPayload): Promise<void> {
        logger.info(`[Marketplace] Nouvelle commande ${payload.platform} (Ext ID: ${payload.externalOrderId})`);

        const orderId = SharedKernel.generateId('ORD');

        // 1. Émettre l'événement de commande passée (qui va aller au KDS, déduire les stocks, etc.)
        await NexusEventBus.emitDurable('order.placed', {
            v: 1,
            orderId,
            tenantId,
            tableId: `delivery-${payload.platform}`, // "table" virtuelle
            operatorId: 'system-marketplace',
            items: payload.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                unitPriceInMicrounits: item.priceInCents * 10000,
                discountInMicrounits: 0
            }))
        });

        // 2. Déclencher le flux de paiement externe (qui sera géré par AccountsReceivable pour le lettrage de la commission)
        await NexusEventBus.emitDurable('order.paid', {
            v: 1,
            orderId,
            tenantId,
            amountInMicrounits: payload.totalInCents * 10000,
            method: 'external_marketplace',
            timestamp: Date.now()
        });

        logger.info(`[Marketplace] Commande ${orderId} ingérée et payée via ${payload.platform} (Commission: ${payload.commissionInCents} cts).`);
    }
}
