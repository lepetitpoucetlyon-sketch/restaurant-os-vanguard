/**
 * 🍱 OPERATIONS DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 * Centralized registry for Orders, Tables, and Reservations.
 */

import { SovereignNode, SovereignMap } from '@/shared/nexus-contract';

export type TableStatus =
    | 'free'
    | 'available'
    | 'occupied'
    | 'reserved'
    | 'cleaning'
    | 'locked'
    | string;

export interface Table extends SovereignNode {
    number: string;
    seats: number;
    status: TableStatus;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    zoneId: string;
    floorId?: string;
    shape: TableShape;
}

export interface OrderItemModification extends SovereignMap {
    id: string;
    orderId: string;
    orderItemId: string;
    type: string;
    description: string;
    requestedAt: string;
    approved: boolean;
    respondedAt?: string;
    respondedBy?: string;
    responseNote?: string;
}

export interface OrderItem extends SovereignNode {
    productId: string;
    categoryId?: string;
    name: string;
    quantity: number;
    priceInCents: number;
    modifiers?: string[];
    notes?: string;
    status?: 'pending' | 'cooking' | 'ready' | 'served';
    removedIngredients?: string[];
    addedIngredients?: string[];
    allergens?: string[];
    modification?: OrderItemModification;
}

export type OrderStatus =
    | 'draft'
    | 'new'
    | 'ordered'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled'
    | 'paid'
    | string;

export interface Order extends SovereignNode {
    status: OrderStatus;
    tableId?: string;
    tableNumber: string;
    serverName?: string;
    timestamp: string;
    items: OrderItem[];
    totalInCents: number;
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
}

export interface Reservation extends SovereignNode {
    customerId: string;
    customerName: string;
    tableId?: string;
    date: string; // ISO
    time: string; // HH:mm
    partySize: number;
    covers?: number; // Alias for UI compatibility
    status: 'pending' | 'confirmed' | 'arrived' | 'seated' | 'cancelled' | 'no_show';
    duration?: number; // Estimated duration in minutes
    notes?: string;
}

export type GroupEventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface GroupEvent extends SovereignNode {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: GroupEventStatus;
    customerId?: string;
    customerName: string;
    partySize: number;
    depositInCents?: number;
    isDepositPaid: boolean;
    notes?: string;
}

export type TableShape = 'rect' | 'circle' | string;
