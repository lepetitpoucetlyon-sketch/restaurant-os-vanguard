import type { IDeliveryProvider, DeliveryOrder, DeliveryMenuItem, DeliveryStatus } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * Click & Collect propre — commandes passées via /[slug]/order (page à créer).
 * Lit/écrit directement dans Nexus, pas d'API externe.
 */
export class ClickCollectProvider implements IDeliveryProvider {
    readonly id = 'clickcollect';

    async listPendingOrders(tenantId: string): Promise<DeliveryOrder[]> {
        try {
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/deliveryOrders`) as Record<string, unknown> | null;
            if (!raw) return [];
            return Object.values(raw)
                .filter((o): o is DeliveryOrder => !!o && (o as DeliveryOrder).status === 'new')
                .sort((a, b) => a.placedAt < b.placedAt ? -1 : 1);
        } catch (err) {
            logger.error('[ClickCollectProvider] listPendingOrders error', toError(err).message);
            return [];
        }
    }

    async acknowledgeOrder(orderId: string): Promise<void> {
        logger.info('[ClickCollectProvider] acknowledgeOrder', orderId);
    }

    async updateStatus(orderId: string, status: DeliveryStatus): Promise<void> {
        logger.info('[ClickCollectProvider] updateStatus', orderId, status);
    }

    onWebhook(payload: unknown): DeliveryOrder {
        return payload as DeliveryOrder;
    }

    async getMenu(tenantId: string): Promise<DeliveryMenuItem[]> {
        try {
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/products`) as Record<string, unknown> | null;
            if (!raw) return [];
            return Object.entries(raw).map(([id, p]) => {
                const product = p as Record<string, unknown>;
                return {
                    externalId:          id,
                    name:                String(product.name ?? ''),
                    description:         product.description ? String(product.description) : undefined,
                    priceInMicrounits:   Number(product.priceInMicrounits ?? 0),
                    available:           product.available !== false,
                    category:            product.category ? String(product.category) : undefined,
                };
            });
        } catch (err) {
            logger.error('[ClickCollectProvider] getMenu error', toError(err).message);
            return [];
        }
    }

    async pushMenu(_tenantId: string, _menu: DeliveryMenuItem[]): Promise<void> {
        // Menu interne — pas besoin de push vers un provider externe.
    }
}
