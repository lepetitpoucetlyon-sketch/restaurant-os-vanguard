/**
 * 🍱 OPERATIONS DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 * Derived from Zod Schemas - Single Source of Truth.
 */

import { z } from 'zod';
import { SanitizedStringSchema, TimestampSchema, UUIDSchema, MicrounitsSchema, TaxRateSchema, toMicrounits } from '@/shared/schemas/primitives';

export const TableShapeSchema = z.enum(['rect', 'circle']).or(z.string());

export const TableSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('table').default('table'),
  number:            z.string(),
  seats:             z.number().int().min(1),
  status:            z.enum(['free', 'available', 'occupied', 'reserved', 'cleaning', 'locked']).or(z.string()),
  x:                 z.number(),
  y:                 z.number(),
  width:             z.number().optional(),
  height:            z.number().optional(),
  radius:            z.number().optional(),
  zoneId:            UUIDSchema,
  floorId:           UUIDSchema.optional(),
  shape:             TableShapeSchema,
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(() => Date.now() as number),
}).catchall(z.any());

export const ReservationSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('reservation').default('reservation'),
  customerId:        UUIDSchema,
  customerName:      SanitizedStringSchema,
  tableId:           UUIDSchema.optional(),
  date:              z.string(),
  time:              z.string(),
  partySize:         z.number().int().min(1),
  covers:            z.number().int().min(1).optional(),
  status:            z.enum(['pending', 'confirmed', 'arrived', 'seated', 'cancelled', 'no_show']),
  duration:          z.number().int().min(1).optional(),
  notes:             SanitizedStringSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(() => Date.now() as number),
}).catchall(z.any());

export const FloorSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('floor').default('floor'),
  name:              SanitizedStringSchema,
  level:             z.number().int(),
  isActive:          z.boolean().default(true),
  icon:              z.string().optional(),
  description:       SanitizedStringSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(() => Date.now() as number),
}).catchall(z.any());

export const ZoneSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('zone').default('zone'),
  name:              SanitizedStringSchema,
  color:             z.string(),
  description:       SanitizedStringSchema.optional(),
  floorId:           UUIDSchema.optional(),
  x:                 z.number().optional(),
  y:                 z.number().optional(),
  width:             z.number().optional(),
  height:            z.number().optional(),
  schemaVersion:     z.literal(2).default(2),
  updatedAt:         TimestampSchema.default(() => Date.now() as number),
});

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

export const ConsumptionModeSchema = z.enum(['dine_in', 'takeaway']);
export type ConsumptionMode = z.infer<typeof ConsumptionModeSchema>;

export const OrderLineSchema = z.object({
  id:           UUIDSchema.optional(),
  productId:    UUIDSchema,
  categoryId:   z.string().optional(),
  modifiers:    z.array(z.union([
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      action: z.enum(['add', 'remove', 'info']),
      ingredientId: z.string().optional(),
      quantityImpact: z.number().optional(),
    }),
  ])).default([]),
  name:         z.string().min(1).pipe(SanitizedStringSchema),
  quantity:     z.number().int().min(1, 'Quantité minimale : 1'),
  unitPriceInMicrounits: MicrounitsSchema,
  taxRate:      TaxRateSchema,
  consumptionMode: ConsumptionModeSchema.optional(),
  discountInMicrounits:  MicrounitsSchema.default(toMicrounits(0)),
  notes:        z.string().max(200).pipe(SanitizedStringSchema).optional(),
  status:       z.enum(['pending', 'cooking', 'ready', 'served', 'cancelled']).default('pending'),
  station:      z.string().optional(),
});

export const OrderSchema = z.object({
  id:                  UUIDSchema,
  type:                z.literal('order').default('order'),
  orderNumber:         z.string(),
  tableId:             UUIDSchema.optional(),
  tableName:           z.string().optional(),
  serverName:          z.string().optional(),
  status:              z.enum(['new', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled']),
  items:               z.array(OrderLineSchema),
  totalInMicrounits:   MicrounitsSchema,
  totalHTInMicrounits: MicrounitsSchema.optional(),
  totalTVAInMicrounits: MicrounitsSchema.optional(),
  taxBreakdown:        z.record(z.string(), MicrounitsSchema).optional(),
  consumptionMode:     ConsumptionModeSchema.default('dine_in'),
  createdAt:           TimestampSchema,
  updatedAt:           TimestampSchema,
}).catchall(z.any());

export const CartLineSchema = z.object({
  id:                    UUIDSchema,
  productId:             UUIDSchema,
  categoryId:            UUIDSchema,
  name:                  z.string().min(1),
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
  notes:                 z.string().optional(),
});

export type Table = z.infer<typeof TableSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type Floor = z.infer<typeof FloorSchema>;
export type Zone = z.infer<typeof ZoneSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderLineSchema>;
export type OrderItemModification = z.infer<typeof OrderItemModificationSchema>;
export type CartLine = z.infer<typeof CartLineSchema>;

export type TableStatus = Table['status'];
export type TableShape = 'rect' | 'circle' | string;
export type OrderStatus = Order['status'];
export type GroupEventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

import type { Microunits } from '@/shared/schemas/primitives';

export interface CartItem extends Omit<CartLine, 'id'> {
    cartId: string;
    discountPercent?: number;
    originalPriceInMicrounits?: Microunits;
    isOffer?: boolean;
    course?: 'entree' | 'plat' | 'dessert';
    sentToKitchenAt?: string;
    sentAt?: number;
    doggyBag?: boolean;
    takeawayBox?: boolean;
    courseStatus?: 'pending' | 'firing' | 'fired' | 'served';
}

export type EventType = 'marriage' | 'anniversaire' | 'entreprise' | 'cocktail' | 'autre';
export type SpaceConfiguration = 'banquet' | 'buffet' | 'cocktail' | 'u_shape' | 'theater' | 'custom';

export interface GroupEvent {
    id: string;
    title?: string;
    date?: string;
    eventNumber?: string;
    establishmentId?: string;
    type?: EventType;
    name?: string;
    description?: string;
    organizer?: {
        type: 'individual' | 'company';
        name: string;
        companyName?: string;
        email: string;
        phone: string;
        address?: {
            street: string;
            city: string;
            postalCode: string;
            country: string;
        };
    };
    spaceId?: string;
    spaceName?: string;
    configuration?: SpaceConfiguration;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    covers?: {
        initial: number;
        confirmed: number;
        final: number;
        minimum: number;
    };
    status: GroupEventStatus;
    customerId?: string;
    customerName?: string;
    partySize: number;
    depositInCents?: number;
    depositInMicrounits?: number;
    isDepositPaid?: boolean;
    notes?: string;
}
