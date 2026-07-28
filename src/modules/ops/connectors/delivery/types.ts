export type DeliveryStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';

export interface DeliveryOrderItem {
    name: string;
    quantity: number;
    unitPriceInMicrounits: number;
    notes?: string;
}

export interface DeliveryOrder {
    id: string;
    tenantId: string;
    externalId: string;
    source: string;   // 'ubereats' | 'deliveroo' | 'clickcollect' | ...
    status: DeliveryStatus;
    items: DeliveryOrderItem[];
    customer: { name: string; phone?: string };
    deliveryAddress?: { street: string; city: string; postalCode: string; instructions?: string };
    totalInMicrounits: number;
    placedAt: string; // ISO 8601
}

export interface DeliveryMenuItem {
    externalId: string;
    name: string;
    description?: string;
    priceInMicrounits: number;
    available: boolean;
    category?: string;
}

export interface IDeliveryProvider {
    readonly id: string;
    listPendingOrders(tenantId: string): Promise<DeliveryOrder[]>;
    acknowledgeOrder(orderId: string): Promise<void>;
    updateStatus(orderId: string, status: DeliveryStatus): Promise<void>;
    onWebhook(payload: unknown): DeliveryOrder;
    getMenu(tenantId: string): Promise<DeliveryMenuItem[]>;
    pushMenu(tenantId: string, menu: DeliveryMenuItem[]): Promise<void>;
}
