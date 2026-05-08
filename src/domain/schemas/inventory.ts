import { z } from 'zod';
import { SanitizedStringSchema, MicrounitsSchema, TimestampSchema, UUIDSchema } from './primitives';

export const StockItemSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('stockItem').default('stockItem'),
  name:              z.string().min(1, 'Nom obligatoire').max(120).pipe(SanitizedStringSchema),
  sku:               z.string().regex(/^[A-Z0-9\-]{3,20}$/, 'SKU invalide').pipe(SanitizedStringSchema).optional(),
  priceInMicrounits: MicrounitsSchema.optional(), // Made optional for now to avoid breaking existing data without default
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
  updatedAt:         TimestampSchema.default(Date.now() as unknown),
}).catchall(z.any()).refine(
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

export const StockItemPatchSchema = StockItemSchema.partial().omit({ id: true });
export type StockItemPatch = z.infer<typeof StockItemPatchSchema>;
