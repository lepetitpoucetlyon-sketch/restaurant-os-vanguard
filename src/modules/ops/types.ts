/**
    description: string;
    oldValue?: string;
    newValue?: string;
    requestedBy: string;
    requestedAt: Date;
    status: ModificationStatus;
    respondedBy?: string;
    respondedAt?: Date;
    responseNote?: string;
}

export interface OrderItem {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined; // Phase 9: Sovereign Mapping
    id: string;
    productId: string;
    categoryId?: string;
    name: string;
    quantity: number;
    priceInCents: number;
    modifiers?: string[];
    notes?: string;
    status: OrderItemStatus;
    removedIngredients?: string[];
    addedIngredients?: string[];
    allergens?: string[];
    pendingModification?: any;
}

export interface Order {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined; // Phase 9: Sovereign Mapping
    id: string;
    tableId: string;
    tableNumber: string;
    serverName: string;
    timestamp: Date;
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
    data?: any; // legacy alias
    updatedAt?: Date | string;
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

export interface CartItem {
    cartId: string;
    productId: string;
    categoryId: string;
    name: string;
    priceInCents: number;
    quantity: number;
    modifiers: string[];
}
