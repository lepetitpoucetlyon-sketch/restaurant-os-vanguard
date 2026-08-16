/**
 * supplier.types.ts
 * 
 * Modèle de Domaine Universel pour les Fournisseurs (SRM Restaurant OS).
 * Invariants : Montants en microunités / centimes entiers (zéro flottant).
 */

export type SupplierCategory = 
  | 'meats' 
  | 'seafood' 
  | 'produce' 
  | 'dry_goods' 
  | 'beverages' 
  | 'hygiene_packaging' 
  | 'equipment' 
  | 'services' 
  | 'other';

export type PaymentTerms = 
  | 'IMMEDIATE' 
  | '30_DAYS' 
  | '30_DAYS_END_OF_MONTH' 
  | '45_DAYS' 
  | '60_DAYS';

export type PaymentMethod = 
  | 'SEPA_DEBIT' 
  | 'BANK_TRANSFER' 
  | 'LCR_BOR' 
  | 'CREDIT_CARD' 
  | 'CHECK';

export interface SupplierContact {
  id: string;
  name: string;
  role: 'commercial' | 'delivery_driver' | 'accounting' | 'general' | 'director';
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface SupplierDeliverySchedule {
  allowedDays: number[]; // 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
  deliveryWindow: string; // ex: "06:00-09:00"
  cutOffTime: string;     // ex: "22:00"
  cutOffDaysBefore: number; // ex: 1 pour J-1 (commande avant 22h la veille)
}

export interface SupplierEntity {
  id: string;
  tenantId: string;
  name: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
  category: SupplierCategory;
  contacts: SupplierContact[];
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliverySchedule: SupplierDeliverySchedule;
  francoCts: number;           // Seuil de commande minimum pour livraison gratuite en centimes (ex: 25000 = 250,00 €)
  shippingCostCts: number;     // Frais de port facturés si sous le franco (ex: 2500 = 25,00 €)
  paymentTerms: PaymentTerms;
  paymentMethod: PaymentMethod;
  iban?: string;
  bic?: string;
  preferredOrderChannel: 'WHATSAPP' | 'SMS' | 'EMAIL_PDF' | 'EDI_API';
  fallbackSupplierId?: string; // Fournisseur de secours en cas de rupture
  isActive: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
