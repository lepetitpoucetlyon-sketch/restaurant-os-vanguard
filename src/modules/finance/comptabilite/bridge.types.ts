import type { CartItem, JournalEntry, FiscalSeal } from '@nexus/contracts';
import type { ConsumptionMode } from '@/modules/ops';

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
  partialPayments?: { amount: number; guest: number; method?: string }[];
  tipInMicrounits?: number;
}

export interface BridgeResult {
  journalEntry: JournalEntry;
  seal: FiscalSeal;
}
