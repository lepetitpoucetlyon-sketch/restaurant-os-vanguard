import { z } from 'zod';

/**
 * 🧬 SchemaRegistry - The Nexus Customs
 * Stores and provides validation schemas for all modules.
 */
export const SchemaRegistry: Record<string, Record<string, z.ZodSchema>> = {
    ACCOUNTING: {
        journalEntries: z.object({
            id: z.string(),
            pieceNumber: z.string().min(1),
            description: z.string(),
            amountInCents: z.number().int(),
            type: z.enum(['revenue', 'expense', 'tax', 'bank', 'payroll', 'other', 'loss', 'sales']),
            isValidated: z.boolean().optional(),
            date: z.string()
        })
    },
    ORDERS: {
        orders: z.object({
            id: z.string(),
            tableNumber: z.string(),
            status: z.enum(['draft', 'new', 'ordered', 'preparing', 'ready', 'delivered', 'cancelled', 'paid']),
            // Microunits Protocol: totalInMicrounits is canonical; totalInCents is a deprecated parity mirror. Both optional.
            totalInMicrounits: z.number().int().optional(),
            totalInCents: z.number().int().optional(),
            timestamp: z.string().or(z.date())
        }).catchall(z.any())
    },
    STOCK: {
        items: z.object({
            id: z.string(),
            ingredientName: z.string(),
            quantity: z.number(),
            status: z.enum(['available', 'reserved', 'expired', 'low', 'quarantine', 'depleted', 'discarded'])
        }),
        movements: z.object({
            id: z.string(),
            type: z.enum(['reception', 'transfer', 'consumption', 'waste', 'adjustment', 'sale']),
            quantity: z.number()
        })
    },
    FISCAL: {
        seals: z.object({
            id: z.string().optional(),
            hash: z.string(),
            previousHash: z.string(),
            timestamp: z.string().optional()
        })
    },
    HACCP: {
        hygieneLogs: z.object({
            item: z.string(),
            zone: z.string(),
            status: z.enum(['ok', 'alert', 'done', 'critical']),
            user: z.string()
        }),
        wasteLogs: z.object({
            item: z.string(),
            quantity: z.number().positive(),
            unit: z.string()
        })
    }
};

