/**
 * IEInvoicingProvider — §7.3 Réception e-facture
 *
 * Contrat d'adaptation vers une Plateforme Agréée (PA) e-invoicing.
 * Le choix de la PA (Chorus Pro, Freedz, Pennylane, etc.) est une
 * décision business — ce contrat isole le code métier du transport.
 *
 * Obligation légale 1er septembre 2026 : RÉCEPTION uniquement.
 * L'émission (2027) réutilisera le même provider + FacturXGenerator.
 */

export type EInvoiceFormat = 'factur-x' | 'ubl' | 'cii';

export type EInvoiceStatus =
  | 'received'
  | 'validated'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'disputed';

export interface EInvoiceParty {
  name: string;
  siret: string;
  vatNumber?: string;
  address: string;
  country: string;
}

export interface EInvoiceLine {
  description: string;
  quantity: number;
  unitPriceHTInMicrounits: number;
  vatRate: number;
  totalHTInMicrounits: number;
  totalTTCInMicrounits: number;
}

export interface InboundEInvoice {
  providerInvoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  format: EInvoiceFormat;
  seller: EInvoiceParty;
  buyer: EInvoiceParty;
  lines: EInvoiceLine[];
  totalHTInMicrounits: number;
  totalVATInMicrounits: number;
  totalTTCInMicrounits: number;
  currency: string;
  rawXml?: string;
  pdfUrl?: string;
}

export interface EInvoiceWebhookPayload {
  eventType: 'invoice.received' | 'invoice.status_changed';
  invoiceId: string;
  timestamp: string;
  signature: string;
}

export interface IEInvoicingProvider {
  readonly name: string;

  verifyWebhookSignature(payload: EInvoiceWebhookPayload, secret: string): boolean;

  fetchInvoice(providerInvoiceId: string, tenantId: string): Promise<InboundEInvoice>;

  acknowledgeReceipt(providerInvoiceId: string, tenantId: string): Promise<void>;

  rejectInvoice(
    providerInvoiceId: string,
    tenantId: string,
    reason: string,
  ): Promise<void>;

  listPendingInvoices(tenantId: string): Promise<InboundEInvoice[]>;
}
