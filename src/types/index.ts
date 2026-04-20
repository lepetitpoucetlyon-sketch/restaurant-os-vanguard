/**
 * RESTAURANT OS - Centralized Type Definitions
 * All domain types re-exported from modular files for consistency and maintainability.
 * 
 * This is the barrel export file - import from here for backward compatibility.
 * For new code, prefer importing directly from the specific type file.
 */

// Auth & Users
export * from './auth.types';
export * from '@/shared/nexus-contract';

// Tables & Floor Plan
export * from '@/modules/ops/tables.types';

// Orders
export * from '@/modules/ops/types';

// Reservations & CRM
export * from '@/modules/ops/reservations.types';
export type { CRM, CRMGroup } from '@/modules/ops/reservations.types';

// Inventory & Stock Management
export * from '@/modules/inventory/types';

// Accounting & Finance
export * from '@/modules/finance/types';

// Staff & HR (Leaves, Compliance)
export * from '@/modules/hr/types';

// HACCP & Quality Control
export * from '@/modules/haccp/types';

// Common / Shared Types (Products, Menu, Notifications, etc.)
export * from './common.types';

// Quotes (Devis)
export * from '@/modules/marketing/quotes.types';

// Groups & Events
export * from '@/modules/ops/groups.types';

// Recruitment & HR Pipeline
export * from './recruitment';

// Oracle AI Types
export * from './oracle.types';

// SEO & Referencing
export * from '@/modules/marketing/seo.types';

// Permissions & Roles
export * from './permissions.types';

// Marketing & Reputation
export * from '@/modules/marketing/types';

// Doc Types
export * from '@/lib/docs/types';

// Maintenance Support
export * from './maintenance.types';

// --- GRADE X : SOVEREIGN TYPES ---
export interface StockEvent {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  timestamp: string;
  referenceId?: string;
}

export type LegacyOrder = Order;

// Grade X Blueprints for Payroll & Shifts are now defined in staff.types.ts and exported via barrel.
