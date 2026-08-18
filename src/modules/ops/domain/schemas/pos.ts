// src/domain/schemas/pos.ts
import { z } from 'zod';
import { MicrounitsSchema, TimestampSchema, UUIDSchema, sanitized, toMicrounits, TaxRateSchema } from '@/shared/schemas/primitives';
import { ConsumptionModeSchema } from './orders';

export const CartLineSchema = z.object({
  id:                    UUIDSchema,
  productId:             UUIDSchema,
  categoryId:            UUIDSchema,
  name:                  sanitized(1, 80),
  quantity:              z.number().int().min(1),
  unitPriceInMicrounits: MicrounitsSchema,
  taxRate:               TaxRateSchema,
  consumptionMode:       ConsumptionModeSchema.optional(),
  discountInMicrounits:  MicrounitsSchema.default(toMicrounits(0)),
  modifiers:             z.array(z.object({
    id: z.string(),
    name: z.string(),
    action: z.enum(['add', 'remove', 'info']),
    ingredientId: z.string().optional(),
    quantityImpact: z.number().optional()
  })).default([]),
  notes:                 sanitized(0, 200).optional(),
});

export const PaymentSplitSchema = z.object({
  mode:             z.enum(['cash', 'card', 'check', 'ticket_resto', 'transfer', 'on_account']),
  amountInMicrounits: MicrounitsSchema,
  reference:        sanitized(0, 50).optional(),
});

export const PosTicketSchema = z.object({
  id:               UUIDSchema,
  correlationId:    UUIDSchema,
  hashPrecedent:    z.string().length(64),
  hash:             z.string().length(64),
  serverTimestamp:  TimestampSchema,
  deviceId:         z.string().min(1),
  operatorId:       UUIDSchema,
  operatorRole:     z.enum(['admin','manager','waiter','cashier','barman']),
  consumptionMode:  ConsumptionModeSchema.default('dine_in'),
  tableId:          UUIDSchema.nullable(),
  customerId:       UUIDSchema.nullable(),
  lines:            z.array(CartLineSchema).min(1),
  totalHTInMicrounits:  MicrounitsSchema,
  totalTTCInMicrounits: MicrounitsSchema,
  tvaBreakdown:     z.record(TaxRateSchema, MicrounitsSchema),
  discounts:        z.array(z.object({
    type:           z.enum(['percent', 'fixed', 'happy_hour']),
    value:          z.number().positive(),
    authorizedBy:   UUIDSchema,
    reason:         sanitized(0, 100),
  })).default([]),
  payments:         z.array(PaymentSplitSchema).min(1),
  status:           z.enum(['validated', 'cancelled', 'refunded']),
  receiptNumber:    z.string().regex(/^[0-9]{4}-[0-9]{6,}$/),
  covers:           z.number().int().min(1).max(50),
  schemaVersion:    z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
}).refine(
  data => data.hash !== data.hashPrecedent,
  { message: 'hash et hashPrecedent doivent être différents', path: ['hash'] }
).refine(
  data => {
    const paymentTotal = data.payments.reduce(
      (acc, p) => acc + p.amountInMicrounits, 0
    );
    return Math.abs(paymentTotal - data.totalTTCInMicrounits) < 1000;
  },
  { message: 'La somme des paiements ne correspond pas au total TTC', path: ['payments'] }
);

export type PosTicket = z.infer<typeof PosTicketSchema>;
export type CartLine  = z.infer<typeof CartLineSchema>;
export type PaymentSplit = z.infer<typeof PaymentSplitSchema>;

// ─── CartItem (ops/engine canonical type, promoted to domain) ────────────────
import type { Microunits } from '@/shared/schemas/primitives';

export type CourseType = 'entree' | 'plat' | 'dessert';

export interface CartItem extends Omit<CartLine, 'id'> {
    cartId: string;
    discountPercent?: number;
    originalPriceInMicrounits?: Microunits;
    isOffer?: boolean;
    course?: CourseType;
    firedAt?: number;
}

// ─── Split bill (promoted from SplitBillDialog component) ────────────────────
export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}
