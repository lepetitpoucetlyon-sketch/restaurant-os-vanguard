import { SovereignData } from '@/shared/nexus-contract';

/**
 * ORDERS TYPES
 */

export type OrderStatus = 'draft' | 'new' | 'ordered' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'paid';
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

export interface OrderItem {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id?: string;
    productId: string;
    categoryId?: string;
    name: string;
    quantity: number;
    priceInCents: number;
    modifiers?: string[];
    notes?: string;
    status?: OrderItemStatus;
    removedIngredients?: string[];
    addedIngredients?: string[];
    allergens?: string[];
    pendingModification?: OrderItemModification;
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

export interface Order {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id: string;
    tableId: string;
    tableNumber: string;
    serverName: string;
    timestamp: string;
    status: OrderStatus;
    items: OrderItem[];
    totalInCents: number;
    total?: number; // Legacy compatibility
    paymentMethod?: 'card' | 'cash' | 'mobile';
    isUrgent?: boolean;
    customerName?: string;
    customerId?: string;
    blockchainProof?: {
        hash: string;
        timestamp: string;
        blockNumber: number;
        status: 'pending' | 'confirmed' | 'failed';
        maticTxId?: string;
    };
    totalRevenue?: number; // computed alias
    data?: SovereignData; // legacy alias
    updatedAt?: string;
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
