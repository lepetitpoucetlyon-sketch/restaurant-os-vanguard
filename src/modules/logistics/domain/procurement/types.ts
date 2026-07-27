/**
 * 🏛️ Procurement Types - Grade X+++
 */

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitPriceInCents: number;
    }>;
    totalAmountInCents: number;
    status: 'draft' | 'submitted' | 'engaged' | 'delivered' | 'cancelled';
    createdAt: string;
}

export interface DeliveryNote {
    id: string;
    purchaseOrderId: string;
    deliveredItems: Array<{
        productId: string;
        quantityDelivered: number;
    }>;
    deliveryDate: string;
    signatureHash?: string;
    status: 'pending' | 'signed' | 'disputed';
    totalAmountInCents: number;
}
