/**
 * IEInvoicingProvider — contrat PA e-invoicing (inbound + outbound)
 *
 * Implémentations : SuperPdpProvider, B2BrouterProvider, MockEInvoicingProvider.
 * Résolution par tenant via EInvoiceProviderFactory.
 *
 * Réception fournisseur : déjà opérationnelle (obligation sept. 2026).
 * Émission B2B (tickets > 150€ HT, facturation SaaS) : registerCompany + emitInvoice.
 */

export type EInvoiceFormat = 'factur-x' | 'ubl' | 'cii';

export type EInvoiceStatus =
  | 'received'
  | 'validated'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'disputed';

/** Statuts lifecycle côté émission (machine d'état DGFiP / PA) */
export type OutboundEInvoiceStatus =
  | 'draft'
  | 'submitted'       // déposée auprès de la PA
  | 'deposee'         // PA l'a transmise à la DGFiP
  | 'mise_a_disposition' // livrée à la plateforme acheteur
  | 'approuvee'       // acheteur a accepté
  | 'refusee'         // acheteur a contesté
  | 'encaissee'       // paiement confirmé → exigibilité TVA
  | 'rejetee_dgfip';  // format ou SIREN invalide côté DGFiP

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

/** Facture émise par le tenant (ou la plateforme) vers un client B2B/B2G */
export interface OutboundEInvoice {
  /** Référence interne (POS ticket ID, subscription ID, etc.) */
  internalRef: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  /** 'b2b' = client professionnel | 'b2g' = administration publique (Chorus Pro) */
  clientType: 'b2b' | 'b2g';
  seller: EInvoiceParty;
  buyer: EInvoiceParty;
  lines: EInvoiceLine[];
  totalHTInMicrounits: number;
  totalVATInMicrounits: number;
  totalTTCInMicrounits: number;
  currency: string;
}

export interface OutboundEmitResult {
  providerInvoiceId: string;
  status: OutboundEInvoiceStatus;
}

export interface EInvoiceWebhookPayload {
  eventType: 'invoice.received' | 'invoice.status_changed' | 'outbound.status_changed';
  invoiceId: string;
  timestamp: string;
  signature: string;
  /** Pour les webhooks outbound — statut mis à jour */
  newStatus?: OutboundEInvoiceStatus;
}

export interface IEInvoicingProvider {
  readonly name: string;

  // ── Inbound (réception fournisseur) ──────────────────────────────────────

  verifyWebhookSignature(payload: EInvoiceWebhookPayload, secret: string): boolean;

  fetchInvoice(providerInvoiceId: string, tenantId: string): Promise<InboundEInvoice>;

  acknowledgeReceipt(providerInvoiceId: string, tenantId: string): Promise<void>;

  rejectInvoice(
    providerInvoiceId: string,
    tenantId: string,
    reason: string,
  ): Promise<void>;

  listPendingInvoices(tenantId: string): Promise<InboundEInvoice[]>;

  // ── Outbound (émission B2B / facturation SaaS) ────────────────────────────

  /** Déclare le SIRET de la société auprès de la PA (annuaire national, une fois). */
  registerCompany(siret: string, companyName: string): Promise<void>;

  /** Émet une facture B2B ou B2G. Retourne l'ID PA + statut initial. */
  emitInvoice(invoice: OutboundEInvoice): Promise<OutboundEmitResult>;

  /** Interroge le statut d'une facture émise (polling fallback si pas de webhook). */
  getOutboundStatus(providerInvoiceId: string): Promise<OutboundEInvoiceStatus>;
}
