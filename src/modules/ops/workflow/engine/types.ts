import type { Microunits, TaxRate } from '@/shared/schemas/primitives';
import type { Order, OrderLine as OrderItem, OrderItemModification } from '../../domain/schemas/orders';
import type { Product } from '@/modules/commerce/domain/schemas/commerce';

export type { Order, OrderItem, OrderItemModification };
export type OrderStatus = Order['status'];
export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served';
export type ModificationStatus = 'pending' | 'approved' | 'rejected';

export interface SovereignProduct extends Product {
    priceInMicrounits: Microunits;
    priceInCents?: number;
    taxRate: TaxRate;
}

import { CartLineSchema, CartLine, PosTicket, PosTicketSchema } from '../../domain/schemas/pos';
export { CartLineSchema, PosTicketSchema };
export type { CartLine, PosTicket };

/** Course assignment for multi-course meal service (pos-3). */
export type CourseType = 'entree' | 'plat' | 'dessert';

export interface CartItem extends Omit<CartLine, 'id'> {
    cartId: string;
    /**
     * Percentage discount applied by staff (e.g. 10 = 10%).
     * Used for strikethrough display only — the effective price
     * is already reflected in unitPriceInMicrounits.
     */
    discountPercent?: number;
    /**
     * Pre-discount unit price stored for strikethrough display.
     * Set when a discount is applied so the original price remains visible.
     */
    originalPriceInMicrounits?: Microunits;
    /**
     * When true the item is treated as a management offer (prix = 0).
     */
    isOffer?: boolean;
    /**
     * Course assignment (pos-3): groups items for sequential service.
     * Items without a course go to the kitchen immediately on "Envoyer".
     */
    course?: CourseType;
    /**
     * Timestamp (ms) when this course was fired to the kitchen.
     * Undefined = not yet sent. Set by handleSendCourse().
     */
    sentAt?: number;
    /**
     * T21: marked for doggy bag at checkout.
     */
    doggyBag?: boolean;
}

export interface OrdersContextType {
    orders: Order[];
    addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'totalInCents'> & { status?: OrderStatus }) => Promise<void>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    updateOrderItemStatus: (orderId: string, itemIndex: number, status: OrderItem['status']) => Promise<void>;
    updateOrderItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    requestItemModification: (orderId: string, itemId: string, modification: Omit<OrderItemModification, 'id' | 'orderId' | 'orderItemId' | 'requestedAt' | 'status'>) => Promise<void>;
    respondToModification: (orderId: string, itemId: string, approved: boolean, respondedBy: string, responseNote?: string) => Promise<void>;
    getPendingModifications: () => OrderItemModification[];
    totalRevenueInCents: number;
    totalRevenue: number;
    isLoading: boolean;
    agent?: {
        query: (prompt: string, context?: unknown) => Promise<unknown>;
        isProcessing: boolean;
    };
    expert?: {
        queryExpert: (prompt: string, contextData?: unknown) => Promise<unknown>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
}

export type ConsumptionMode = 'dine_in' | 'takeaway';
