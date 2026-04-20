// @ts-nocheck
/**
 * RESTAURANT OS - Centralized Type Definitions
 * All domain types re-exported from modular files for consistency and maintainability.
 * 
 * This is the barrel export file - import from here for backward compatibility.
 * For new code, prefer importing directly from the specific type file.
 */

// Auth & Users
export * from './auth.types';

// Tables & Floor Plan
export * from './tables.types';

// Orders
export * from './orders.types';
import { Order } from './orders.types';

// Reservations & CRM
export * from './reservations.types';

// Inventory & Stock Management
export * from './inventory.types';

// Accounting & Finance
export * from './accounting.types';

// Staff & HR (Leaves, Compliance)
export * from './staff.types';

// HACCP & Quality Control
export * from './haccp.types';

// Common / Shared Types (Products, Menu, Notifications, etc.)
export * from './common.types';

// Quotes (Devis)
export * from './quotes.types';

// Groups & Events
export * from './groups.types';

// SEO & Referencing
export * from './seo.types';

// Permissions & Roles
export * from './permissions.types';

// Recruitment & HR Pipeline
export * from './recruitment';

// Oracle AI Types
export * from './oracle.types';

// --- GRADE X : SOVEREIGN TYPES ---
export interface StockEvent {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  timestamp: string;
  referenceId?: string;
}

export interface Product {
    id: string;
    name: string;
    priceInCents: number;
    category: string;
    description?: string;
    imageUrl?: string;
    isAvailable: boolean;
}

export type LegacyOrder = Order;
// Grade X Blueprints for Payroll & Shifts are now defined in staff.types.ts and exported via barrel.
