import { z } from 'zod';
import { SanitizedStringSchema, MicrounitsSchema, TimestampSchema, UUIDSchema } from '@/domain/schemas/primitives';

const StockItemBaseSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('stockItem').default('stockItem'),
  name:              z.string().min(1, 'Nom obligatoire').max(120).pipe(SanitizedStringSchema),
  sku:               z.string().regex(/^[A-Z0-9\-]{3,20}$/, 'SKU invalide').pipe(SanitizedStringSchema).optional(),
  priceInMicrounits: MicrounitsSchema.optional(),
  quantityInStock:   z.number().min(0, 'Le stock ne peut pas être négatif').default(0),
  unit:              z.enum(['kg', 'g', 'l', 'cl', 'ml', 'unit', 'portion', 'piece', 'bunch', 'crate', 'box', 'bottle', 'can']),
  threshold:         z.number().min(0, 'Seuil doit être positif ou zéro').optional(),
  criticalThreshold: z.number().min(0, 'Seuil critique doit être positif ou zéro').optional(),
  supplierId:        z.string().optional(),
  lastAuditDate:     TimestampSchema.optional(),
  lotNumber:         z.string().pipe(SanitizedStringSchema).optional(),
  expiryTimestamp:   TimestampSchema.nullable().optional(),
  locationXYZ:       z.tuple([z.number(), z.number(), z.number()]).nullable().optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(() => Date.now() as unknown as ReturnType<typeof Date.now>),
}).catchall(z.any());

export const StockItemSchema = StockItemBaseSchema.refine(
  data => {
    if (data.criticalThreshold !== undefined && data.threshold !== undefined) {
        return data.criticalThreshold <= data.threshold;
    }
    return true;
  },
  { message: 'Le seuil critique doit être ≤ au seuil bas', path: ['criticalThreshold'] }
);

export const InventoryTransactionSchema = z.object({
  id:                UUIDSchema,
  itemId:            UUIDSchema,
  type:              z.enum(['addition', 'removal', 'sale', 'loss', 'adjustment']),
  quantity:          z.number(),
  reason:            SanitizedStringSchema,
  timestamp:         TimestampSchema,
  userId:            UUIDSchema,
});

export type StockItem = z.infer<typeof StockItemSchema>;
export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;

export const StockItemPatchSchema = StockItemBaseSchema.partial().omit({ id: true });
export type StockItemPatch = z.infer<typeof StockItemPatchSchema>;

// ─── Procurement (promoted from logistics/domain/procurement/types) ───────────
export interface PurchaseOrder {
    id: string;
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitPriceInCents: number }>;
    totalAmountInCents: number;
    status: 'draft' | 'submitted' | 'engaged' | 'delivered' | 'cancelled';
    createdAt: string;
}

export interface DeliveryNote {
    id: string;
    purchaseOrderId: string;
    deliveredItems: Array<{ productId: string; quantityDelivered: number }>;
    deliveryDate: string;
    signatureHash?: string;
    status: 'pending' | 'signed' | 'disputed';
    totalAmountInCents: number;
}

// ─── Intelligence prediction (promoted from intelligence/services/OracleEngine) ─
export interface OraclePrediction {
    estimatedDaysRemaining: number;
    confidence: number;
    trend: 'STABLE' | 'ACCELERATING' | 'DECELERATING';
    scenarios: { optimistic: number; pessimistic: number; p50: number };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ─── ExtractedInvoice (promoted from intelligence/services/VisionService) ─────
import type { ExtractedInvoiceItem } from './supplier-invoice.schemas';

export interface ExtractedInvoice {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    currency: string;
    totalHT: number;
    totalTTC: number;
    items: ExtractedInvoiceItem[];
}
