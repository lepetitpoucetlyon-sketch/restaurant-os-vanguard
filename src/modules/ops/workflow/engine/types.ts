import { Microunits, TaxRate } from '@/shared/schemas/primitives';
import type { Order, OrderItem, OrderStatus, Product } from '@nexus/contracts/nexus-internal-mapper';
export type { Order, OrderItem, OrderStatus };

export type OrderItemStatus = 'pending' | 'cooking' | 'ready' | 'served';
export type ModificationStatus = 'pending' | 'approved' | 'rejected';

// Import depuis le fichier source (ops.types) et non le barrel '@nexus/contracts'
// pour casser le cycle ops/engine/types <-> contracts/index.
import type { OrderItemModification } from '@nexus/contracts/ops.types';
export type { OrderItemModification };

export interface SovereignProduct extends Product {
    priceInMicrounits: Microunits;
    priceInCents?: number;
    taxRate: TaxRate;
}

import { CartLineSchema, CartLine } from '@nexus/contracts';
import { PosTicketSchema, type PosTicket } from '../../domain/schemas/pos';
export { CartLineSchema, PosTicketSchema };
export type { CartLine, PosTicket };

/** Course assignment for multi-course meal service (pos-3). */
export type CourseType = 'entree' | 'plat' | 'dessert';

import type { CartItem } from '@nexus/contracts/ops.types';
export type { CartItem };

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
