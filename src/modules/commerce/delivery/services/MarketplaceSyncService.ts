import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/modules/ops/engine/types';

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

        const orderId = crypto.randomUUID();
        const tableId = `delivery-${payload.platform}`;
        const mappedItems = payload.items.map(item => ({
            cartId: item.id,
            productId: item.id,
            categoryId: 'marketplace',
            name: item.id,
            quantity: item.quantity,
            unitPriceInMicrounits: item.priceInCents * 10_000,
            discountInMicrounits: 0,
            taxRate: '0.10' as const,
            modifiers: [],
        })) as unknown as CartItem[];

        // 1. Émettre l'événement de commande passée (KDS, déduction stock, etc.)
        await NexusEventBus.emitDurable('order.placed', {
            v: 1,
            orderId,
            tenantId,
            tableId,
            operatorId: 'system-marketplace',
            items: mappedItems,
        });

        // 2. Déclencher le flux de paiement
        await NexusEventBus.emitDurable('order.paid', {
            v: 1,
            orderId,
            tenantId,
            tableId,
            operatorId: 'system-marketplace',
            items: mappedItems,
            totalInMicrounits: payload.totalInCents * 10_000,
            paymentMode: `marketplace_${payload.platform}`,
        });

        logger.info(`[Marketplace] Commande ${orderId} ingérée et payée via ${payload.platform} (Commission: ${payload.commissionInCents} cts).`);
    }
}
