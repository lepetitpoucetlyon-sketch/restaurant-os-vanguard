import { SovereignData } from '@/shared/nexus-contract';

import type { Order, OrderItem, OrderStatus } from '@nexus/contracts/nexus-internal-mapper';
export type { Order, OrderItem, OrderStatus };

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served';
export type ModificationStatus = 'pending' | 'approved' | 'rejected';

export interface OrderItemModification {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id: string;
    orderId: string;
    orderItemId: string;
    type: 'ingredient_remove' | 'ingredient_add' | 'replace_dish' | 'quantity_change' | 'note_update';
    description: string;
    oldValue?: string;
    newValue?: string;
    requestedBy: string;
    requestedAt: string;
    status: ModificationStatus;
    respondedBy?: string;
    respondedAt?: string;
    responseNote?: string;
}

export interface CartItem {
    cartId: string;
    productId: string;
    categoryId: string;
    name: string;
    priceInCents: number;
    quantity: number;
    modifiers?: string[];
    notes?: string;
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
