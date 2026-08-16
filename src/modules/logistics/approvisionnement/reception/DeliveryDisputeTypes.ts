/**
 * DeliveryDisputeTypes.ts
 * 
 * Modèle de gestion des contrôles à la réception, non-conformités, litiges et demandes d'avoir.
 */

export type DisputeReason = 
  | 'MISSING_ITEM'          // Article manquant par rapport au BL
  | 'DAMAGED_PACKAGE'       // Colis écrasé / emballage déchiré
  | 'TEMPERATURE_NON_COMPLIANT' // Rupture chaîne du froid (> +4°C frais / > -18°C surgelé)
  | 'SHORT_EXPIRY_DLC'      // Date limite de consommation trop courte (< seuil)
  | 'QUALITY_DEFECT'        // Produit abîmé / oxydé / non conforme cahier des charges
  | 'OVER_INVOICED_PRICE'   // Prix unitaire facturé supérieur à la mercuriale
  | 'WRONG_ITEM_DELIVERED'; // Produit non commandé reçu à la place

export type DisputeStatus = 
  | 'OPEN' 
  | 'SENT_TO_SUPPLIER' 
  | 'ACCEPTED_CREDIT_NOTE_PENDING' 
  | 'CREDIT_NOTE_RECEIVED' 
  | 'REJECTED' 
  | 'CLOSED';

export interface DisputeLineItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  expectedPackagesCount: number;
  receivedPackagesCount: number;
  missingPackagesCount: number;
  reason: DisputeReason;
  packagePriceHtCts: number;
  claimedAmountHtCts: number; // Montant réclamé en centimes
  photoUrls?: string[];
  comments?: string;
}

export interface DeliveryDisputeEntity {
  id: string;
  tenantId: string;
  disputeNumber: string; // ex: "LIT-202608-0012"
  purchaseOrderId?: string;
  deliveryNoteNumber: string; // Numéro du BL livreur
  supplierId: string;
  supplierName: string;
  reportedById: string;
  status: DisputeStatus;
  lines: DisputeLineItem[];
  totalClaimedHtCts: number;
  totalClaimedVatCts: number;
  totalClaimedTtcCts: number;
  creditNoteNumber?: string; // N° Avoir reçu du fournisseur (ex: "AV-99482")
  creditNoteAmountCts?: number;
  creditNoteReceivedAtUtc?: number;
  isDeductedFromNextPayment: boolean;
  createdAt: number;
  updatedAt: number;
}
