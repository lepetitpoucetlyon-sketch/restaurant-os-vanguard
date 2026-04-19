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
