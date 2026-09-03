/**
 * FinancialNexusTypes.ts
 * 
 * Types partagés pour le pont financier et le journal comptable.
 */

import type { CartItem } from '@nexus/contracts';

export type ConsumptionMode = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMode = 'cash' | 'card' | 'check' | 'ticket_resto' | 'transfer' | 'comp';

export interface BridgePayload {
  cartItems: CartItem[];
  operatorId: string;
  tableId: string | null;
  tenantId: string;
  consumptionMode?: ConsumptionMode;
  paymentMode?: PaymentMode;
  covers?: number;
  isTrainingMode?: boolean;
  partialPayments?: { amountInMicrounits: number; guest: number; method?: string }[];
  orderId?: string;
  idempotencyKey?: string;
}

import type { JournalEntry, FiscalSeal } from '@nexus/contracts';

export interface BridgeResult {
  journalEntry: JournalEntry;
  seal: FiscalSeal;
}

export interface RefundPayload {
  original: JournalEntry;
  operatorId: string;
  tenantId: string;
  reason: string;
}

