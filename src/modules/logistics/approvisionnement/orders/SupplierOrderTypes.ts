/**
 * SupplierOrderTypes.ts
 * 
 * Modèle pour les Bons de Commande Fournisseurs multi-canaux.
 */

export type PurchaseOrderStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'SUBMITTED' 
  | 'CONFIRMED' 
  | 'DELIVERING' 
  | 'PARTIALLY_RECEIVED' 
  | 'RECEIVED' 
  | 'DISPUTED' 
  | 'CANCELLED';

export interface PurchaseOrderItem {
  mercurialeItemId: string;
  ingredientId: string;
  name: string;
  packagingLabel: string;
  packagesCount: number;
  packagePriceHtCts: number;
  totalHtCts: number;
  totalQuantityBaseUnit: number;
}

export interface PurchaseOrderEntity {
  id: string;
  tenantId: string;
  orderNumber: string; // ex: "BC-202608-0042"
  supplierId: string;
  supplierName: string;
  createdById: string;
  approvedById?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalHtCts: number;
  totalVatCts: number;
  totalTtcCts: number;
  francoReached: boolean;
  shippingCostCts: number;
  expectedDeliveryDate: string; // "YYYY-MM-DD"
  deliveryInstructions?: string;
  dispatchChannel: 'WHATSAPP' | 'SMS' | 'EMAIL_PDF' | 'EDI_API';
  dispatchedAtUtc?: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrderDispatchPayload {
  orderId: string;
  orderNumber: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL_PDF' | 'EDI_API';
  recipient: string; // Numéro tel ou Email ou Endpoint API
  formattedBody: string;
  pdfAttachmentName?: string;
  rawJsonPayload?: Record<string, unknown>;
}
