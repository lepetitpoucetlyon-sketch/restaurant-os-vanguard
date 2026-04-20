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
export * from './tables.types';

// Orders
export * from './orders.types';
import { Order } from './orders.types';

// Reservations & CRM
export * from './reservations.types';
export type { Customer, CRMGroup } from './reservations.types';

// Inventory & Stock Management
export * from './inventory.types';

// Accounting & Finance
export * from './accounting.types';
export type { JournalEntry, JournalLine } from './accounting.types';

// Staff & HR (Leaves, Compliance)
export * from './staff.types';

// HACCP & Quality Control
export * from './haccp.types';
export type { MaintenanceLog, Delivery } from './haccp.types';

// Common / Shared Types (Products, Menu, Notifications, etc.)
export * from './common.types';

// Quotes (Devis)
export * from './quotes.types';

// Groups & Events
export * from './groups.types';

// Recruitment & HR Pipeline
export * from './recruitment';

// Oracle AI Types
export * from './oracle.types';

// SEO & Referencing
export * from './seo.types';
export type { SEOProfile } from './seo.types';

// Permissions & Roles
export * from './permissions.types';

// Marketing & Reputation
export * from './marketing.types';
export type { MarketingCampaign, SocialAccount } from './marketing.types';

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
