import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Caisse NF525 salon = 100 % socle universel (emitServiceSealed / ZReport / Refund). */
export const SalonFinanceAdapter = makeFinanceAdapter();
