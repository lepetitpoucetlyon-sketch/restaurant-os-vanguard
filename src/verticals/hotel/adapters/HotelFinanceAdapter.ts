import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Finance hôtel = socle universel + deltas folio & city ledger. */
export const HotelFinanceAdapter = {
  ...makeFinanceAdapter(),
  emitFolioCharged(payload: { tenantId: string; guestId: string; reservationId: string; amountInMicrounits: number; description: string }) {
    NexusEventBus.emitDurable('hotel.folio_charged', payload);
  },
  emitCityLedgerEntry(payload: { tenantId: string; companyId: string; amountInMicrounits: number; reference: string }) {
    NexusEventBus.emitDurable('hotel.city_ledger_entry', payload);
  },
};
