/**
 * 🏛️ RESTAURANT OS - Centralized Type Definitions
 * Version Grade X - Sovereign Alignment
 * 
 * This file is the primary binary bridge for all modules.
 * It re-exports both Shared Kernel and Domain-specific types.
 */

// 🏛️ GRADE X : MASTER KERNEL SUTURE
export * from '@/shared/types';
export * from '@/shared/nexus-contract';
export * from '@/shared/genome.types';

// Domain Core (Bridge to Modules)
export * from '@/modules/ops/types';
export * from '@/modules/ops/tables.types';
export * from '@/modules/ops/reservations.types';
export * from '@/modules/ops/groups.types';
export * from '@/modules/inventory/types';
export * from '@/modules/haccp/types';
export * from '@/modules/finance/types';
export * from '@/modules/hr/types';
export * from '@/modules/marketing/types';
export * from '@/modules/marketing/quotes.types';
export * from '@/modules/marketing/seo.types';

// Internal Type Files (Local src/types/)
export * from './common.types';
export * from './domain.types';
export * from './maintenance.types';
export * from './nexus.types';
export * from './oracle.types';
export * from './permissions.types';
export * from './recruitment';
export * from './settings';

// Recursive Settings Re-exports
export * from './settings/Customer';
export * from './settings/accounting';
export * from './settings/catalog';
export * from './settings/delivery';
export * from './settings/haccp';
export * from './settings/hr';
export * from './settings/identity';
export * from './settings/integrations';
export * from './settings/inventory';
export * from './settings/nexus';
export * from './settings/notifications';
export * from './settings/performance';
export * from './settings/pos';
export * from './settings/recipes';
export * from './settings/reservations';
export * from './settings/schedule';
export * from './settings/security';
export * from './settings/theme';

// --- GRADE X : SOVEREIGN TYPES ---
export interface StockEvent {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  timestamp: string;
  referenceId?: string;
}

import { Order } from '@/modules/ops/types';
export type LegacyOrder = Order;
