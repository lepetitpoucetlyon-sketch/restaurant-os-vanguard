import { atom } from 'jotai';
import { Order, Table, OrderItem, OrderItemModification } from '@nexus/contracts';
import { createProxyDomain } from '@/store/nexusNodeFactory';

// --- 🛒 ORDERS & TABLES DOMAIN (Service room, KDS, Additions) ---

const _orders = createProxyDomain<Order>('orders');
export const ordersNodeAtom = _orders.node;
export const ordersAtom = _orders.data;
export const ordersLoadingAtom = _orders.loading;

const _tables = createProxyDomain<Table>('tables');
export const tablesNodeAtom = _tables.node;
export const tablesAtom = _tables.data;
export const tablesLoadingAtom = _tables.loading;

// --- 🛒 UI STATE (Cart, Modifications) ---
export const activeCartAtom = atom<{ items: OrderItem[]; customerId?: string } | null>(null);
export const pendingModificationsAtom = atom<OrderItemModification[]>([]);

/** 📊 Orders Statistics (Atomic Scalpel) */
export const orderStatsAtom = atom((get) => {
    const orders = get(ordersAtom);
    return {
        total: orders.length,
        revenue: orders.reduce((sum, o) => sum + (o.totalInCents || 0), 0),
        pending: orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length
    };
});

/** 🪑 Available Tables Selector */
export const availableTablesAtom = atom((get) => {
    return get(tablesAtom).filter((t: Table) => t.status === 'free');
});

/** 🕒 Pending Orders Selector (for KDS) */
export const pendingOrdersAtom = atom((get) => {
    return get(ordersAtom).filter((o: Order) => o.status === 'new' || o.status === 'preparing');
});
