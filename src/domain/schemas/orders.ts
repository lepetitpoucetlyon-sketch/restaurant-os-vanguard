import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  priceInCents: z.number().int().min(0),
  status: z.enum(['pending', 'cooking', 'ready', 'served']),
  notes: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
  serverName: z.string(),
  status: z.enum(['draft', 'new', 'preparing', 'ready', 'delivered', 'cancelled', 'paid']),
  items: z.array(OrderItemSchema),
  totalInCents: z.number().int().min(0),
  timestamp: z.any(), // Support for Firestore Timestamp or Date
});

export type ValidatedOrder = z.infer<typeof OrderSchema>;
export type ValidatedOrderItem = z.infer<typeof OrderItemSchema>;
