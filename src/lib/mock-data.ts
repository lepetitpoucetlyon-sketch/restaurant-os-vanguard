/**
 * 📦 Mock Data Ledger - Grade X
 * Infrastructure de données de secours purges et souveraines.
 */

import { Order, User, Customer } from '@nexus/contracts';
import { Ingredient } from '@nexus/contracts/logistics';

export const mockOrders: Order[] = [];
export const mockInventory: Ingredient[] = [];
export const mockStaff: User[] = [];
export const mockCustomers: Customer[] = [];

export interface MockProduct {
    id: string;
    name: string;
    price: number;
    category: string;
    costInCents?: number;
}

export const PRODUCTS: MockProduct[] = [
    { id: '1', name: 'Expresso Mono-Origine', price: 2.50, category: 'Bar', costInCents: 45 },
    { id: '2', name: 'Capuccino Arabe', price: 4.50, category: 'Bar', costInCents: 85 },
    { id: '3', name: 'Dish of the Day', price: 18.00, category: 'Kitchen', costInCents: 650 }
];

export const MOCK_DATA = {
    orders: mockOrders,
    inventory: mockInventory,
    staff: mockStaff,
    customers: mockCustomers,
    products: PRODUCTS
};
