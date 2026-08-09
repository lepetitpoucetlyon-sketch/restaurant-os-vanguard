import type { Microunits } from '@/shared/schemas/primitives';

export type AggregatorPlatform = 'uber_eats' | 'deliveroo' | 'just_eat';

export interface AggregatorOrder {
    id: string;
    tenantId: string;
    platform: AggregatorPlatform;
    externalOrderId: string;
    items: AggregatorOrderItem[];
    totalInMicrounits: Microunits;
    commissionInMicrounits: Microunits;
    netInMicrounits: Microunits;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
    customerName?: string;
    deliveryAddress?: string;
    estimatedDeliveryAt?: string;
    receivedAt: string;
    acceptedAt?: string;
}

export interface AggregatorOrderItem {
    externalProductId: string;
    productId?: string;
    name: string;
    quantity: number;
    priceInMicrounits: Microunits;
    modifiers?: string[];
}

export interface AggregatorConfig {
    platform: AggregatorPlatform;
    apiKey: string;
    restaurantId: string;
    commissionPercent: number;
    enabled: boolean;
}

export interface AggregatorConnector {
    platform: AggregatorPlatform;
    syncCatalog(tenantId: string): Promise<{ synced: number; errors: number }>;
    acceptOrder(tenantId: string, orderId: string): Promise<void>;
    rejectOrder(tenantId: string, orderId: string, reason: string): Promise<void>;
    markReady(tenantId: string, orderId: string): Promise<void>;
}
