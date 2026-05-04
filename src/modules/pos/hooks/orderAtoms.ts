import { atom } from 'jotai';
import { OrderItem, OrderItemModification } from '@nexus/contracts';

// --- 🛒 UI STATE (Cart, Modifications) ---
export const activeCartAtom = atom<{ items: OrderItem[]; customerId?: string } | null>(null);
export const pendingModificationsAtom = atom<OrderItemModification[]>([]);
