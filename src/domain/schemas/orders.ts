import { z } from 'zod';
import { SanitizedStringSchema, MicrounitsSchema, TimestampSchema, UUIDSchema, TaxRateSchema, toMicrounits } from './primitives';

export const OrderItemModificationSchema = z.object({
  id:           UUIDSchema,
  orderId:      UUIDSchema,
  orderItemId:  UUIDSchema,
  type:         z.enum(['ingredient_remove', 'ingredient_add', 'replace_dish', 'quantity_change', 'note_update']),
  description:  z.string().pipe(SanitizedStringSchema),
  oldValue:     z.string().optional(),
  newValue:     z.string().optional(),
  requestedBy:  z.string(),
  requestedAt:  TimestampSchema,
  status:       z.enum(['pending', 'approved', 'rejected']),
  respondedBy:  z.string().optional(),
  respondedAt:  TimestampSchema.optional(),
  responseNote: z.string().optional(),
}).catchall(z.any());

export const OrderLineSchema = z.object({
  id:           UUIDSchema.optional(),
  productId:    UUIDSchema,
  categoryId:   z.string().optional(),
  modifiers:    z.array(z.string()).default([]),
  name:         z.string().min(1).pipe(SanitizedStringSchema),
  quantity:     z.number().int().min(1, 'Quantité minimale : 1'),
  unitPriceInMicrounits: MicrounitsSchema,
  taxRate:      TaxRateSchema,
  discountInMicrounits:  MicrounitsSchema.default(toMicrounits(0)),
  notes:        z.string().max(200).pipe(SanitizedStringSchema).optional(),
  status:       z.enum(['pending', 'cooking', 'ready', 'served', 'cancelled']).default('pending'),
  createdAt:    TimestampSchema.optional(),
  updatedAt:    TimestampSchema.optional(),
  modification: OrderItemModificationSchema.optional(),
});

export const OrderSchema = z.object({
  id:            UUIDSchema,
  type:          z.literal('order').default('order'),
  correlationId: UUIDSchema.optional(),
  tableId:       UUIDSchema.nullable().optional(),
  tableNumber:   z.string().optional(),
  customerId:    UUIDSchema.nullable().optional(),
  operatorId:    UUIDSchema.optional(),
  serverName:    z.string().pipe(SanitizedStringSchema).optional(),
  items:         z.array(OrderLineSchema).min(1, 'Une commande ne peut pas être vide'),
  status:        z.enum(['pending', 'cooking', 'ready', 'served', 'paid', 'cancelled', 'draft', 'new', 'preparing', 'delivered', 'pending_modification']),
  totalInMicrounits: MicrounitsSchema.optional(),
  totalInCents:  z.number().int().min(0).optional(),
  createdAt:     TimestampSchema,
  updatedAt:     TimestampSchema.default(Date.now() as any),
  paidAt:        TimestampSchema.nullable().optional(),
  covers:        z.number().int().min(1).max(50).optional(),
  notes:         z.string().max(500).pipe(SanitizedStringSchema).optional(),
  schemaVersion: z.literal(2).default(2),
}).catchall(z.any()).refine(
  data => data.paidAt === null || data.paidAt === undefined || data.paidAt >= data.createdAt,
  { message: 'La date de paiement ne peut pas précéder la création', path: ['paidAt'] }
);

export type Order = z.infer<typeof OrderSchema>;
export type OrderLine = z.infer<typeof OrderLineSchema>;

export const OrderPatchSchema = OrderSchema.partial().omit({ id: true, correlationId: true, createdAt: true });
export type OrderPatch = z.infer<typeof OrderPatchSchema>;
