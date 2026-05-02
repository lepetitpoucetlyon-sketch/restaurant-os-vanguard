import { z } from 'zod';

export const OrderItemSchema_v1 = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  priceInCents: z.number().int().min(0),
  status: z.enum(['pending', 'cooking', 'ready', 'served']),
  notes: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
});

export const OrderItemSchema_v2 = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  priceInCents: z.number().int().min(0),
  status: z.enum(['pending', 'cooking', 'ready', 'served']),
  notes: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
  schemaVersion: z.literal(2).default(2),
});

export const OrderSchema_v1 = z.object({
  id: z.string(),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
  serverName: z.string(),
  status: z.enum(['draft', 'new', 'preparing', 'ready', 'delivered', 'cancelled', 'paid']),
  items: z.array(OrderItemSchema_v1),
  totalInCents: z.number().int().min(0),
  timestamp: z.union([z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.string()]), // Support for Firestore Timestamp, Date or ISO String
});

export const OrderSchema_v2 = z.object({
  id: z.string(),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
  serverName: z.string(),
  status: z.enum(['draft', 'new', 'preparing', 'ready', 'delivered', 'cancelled', 'paid']),
  items: z.array(OrderItemSchema_v2),
  totalInCents: z.number().int().min(0),
  timestamp: z.union([z.date(), z.object({ seconds: z.number(), nanoseconds: z.number() }), z.string()]), 
  schemaVersion: z.literal(2).default(2),
  updatedAt: z.string().datetime().optional(),
});

export const OrderSchema = OrderSchema_v2;
export const OrderItemSchema = OrderItemSchema_v2;

export type ValidatedOrder = z.infer<typeof OrderSchema_v2>;
export type ValidatedOrderItem = z.infer<typeof OrderItemSchema_v2>;
