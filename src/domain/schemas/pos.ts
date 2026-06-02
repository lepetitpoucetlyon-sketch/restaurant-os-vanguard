// src/domain/schemas/pos.ts
import { z } from 'zod';
import { MicrounitsSchema, TimestampSchema, UUIDSchema, SanitizedStringSchema, sanitized } from './primitives';
import { TaxRateSchema } from './finance';

export const CartLineSchema = z.object({
  id:                    UUIDSchema,
  productId:             UUIDSchema,
  categoryId:            UUIDSchema,
  name:                  sanitized(1, 80),
  quantity:              z.number().int().min(1),
  unitPriceInMicrounits: MicrounitsSchema,
  taxRate:               TaxRateSchema,
  discountInMicrounits:  MicrounitsSchema.default(0 as unknown as import('./primitives').Microunits),
  modifiers:             z.array(z.string()).default([]),
  notes:                 sanitized(0, 200).optional(),
});

export const PaymentSplitSchema = z.object({
  mode:             z.enum(['cash', 'card', 'check', 'ticket_resto', 'transfer']),
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
