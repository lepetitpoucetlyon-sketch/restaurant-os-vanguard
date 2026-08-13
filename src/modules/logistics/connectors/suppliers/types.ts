export interface SupplierProduct {
    externalId: string;
    name: string;
    category?: string;
    unitPrice: number;
    unit: string;   // 'kg' | 'L' | 'pièce' | 'carton' | ...
    minOrderQuantity?: number;
    availability: 'available' | 'out_of_stock' | 'seasonal';
}

export interface OrderItem {
    externalId: string;
    quantity: number;
    unitPrice?: number;
}

/**
 * Bon de livraison côté **provider externe** (webhook / catalogue tiers).
 * Distinct du `DeliveryNote` interne de `@nexus/contracts` utilisé par ProcurementBridge.
 */
export interface SupplierDeliveryNote {
    externalId: string;
    orderId?: string;
    supplierName: string;
    deliveryDate: string;  // YYYY-MM-DD
    items: Array<{ externalId: string; name: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    invoiceUrl?: string;
}

export interface ISupplierProvider {
    readonly id: string;
    fetchCatalog(tenantId: string): Promise<SupplierProduct[]>;
    /** Places an order and returns the provider's order ID. */
    placeOrder(items: OrderItem[]): Promise<string>;
    fetchDeliveryNotes(since: Date): Promise<SupplierDeliveryNote[]>;
    onWebhook(payload: unknown): SupplierDeliveryNote;
}
