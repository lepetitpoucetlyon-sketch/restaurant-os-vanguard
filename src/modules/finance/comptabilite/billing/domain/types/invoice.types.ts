import type { JournalEntry, LegalInvoice } from '@nexus/contracts';

/**
 * Types de la facturation légale.
 *
 * Extraits d'`InvoiceService` pour casser un cycle : le service importe ses deux
 * builders (`CreditNoteBuilder`, `DepositInvoiceBuilder`) en VALEUR, et les
 * builders réimportaient `GeneratedInvoice` depuis le service — arête retour.
 * Les types vivent donc au-dessus des deux, personne ne remonte.
 */

export interface InvoiceFromTicketParams {
  tenantId: string;
  journalEntry: JournalEntry;
  customerName?: string;
  customerAddress?: string;
  customerSiret?: string;
}

export type InvoiceType = 'invoice' | 'credit_note' | 'deposit' | 'from_quote';

export interface GeneratedInvoice extends LegalInvoice {
  sourceJournalEntryId: string;
  customerAddress?: string;
  customerSiret?: string;
  invoiceType?: InvoiceType;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  depositGroupId?: string;
  quoteId?: string;
}
