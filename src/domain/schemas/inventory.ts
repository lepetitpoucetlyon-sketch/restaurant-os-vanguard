// @ts-nocheck
import { z } from 'zod';

export const StockItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  currentQuantity: z.number().min(0),
  minThreshold: z.number().min(0),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'unit', 'bottle', 'box']),
  category: z.string(),
  updatedAt: z.string().datetime(),
  supplierId: z.string().optional(),
});

export const InventoryTransactionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.enum(['addition', 'removal', 'sale', 'loss', 'adjustment']),
  quantity: z.number(),
  reason: z.string(),
  timestamp: z.string().datetime(),
  userId: z.string(),
});

export type DomainStockItem = z.infer<typeof StockItemSchema>;
export type DomainInventoryTransaction = z.infer<typeof InventoryTransactionSchema>;
