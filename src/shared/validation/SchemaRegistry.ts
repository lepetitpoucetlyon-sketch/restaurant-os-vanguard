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
            totalInCents: z.number().int(),
            timestamp: z.string().or(z.date())
        })
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

import { SovereignData, SovereignValue } from '@/shared/nexus-contract';

/**
 * Helper to validate data against local domain schema
 */
export function validateMutation(moduleId: string, key: string, data: unknown) {

    const schema = SchemaRegistry[moduleId]?.[key];
    if (!schema) return { success: true }; // No schema = warning but pass in Phase 1

    const result = schema.safeParse(data);
    if (!result.success) {
        return { 
            success: false, 
            errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
        };
    }
    return { success: true };
}

/**
 * 🏛️ GRADE X SECURE CAST
 * Validates data against the Registry and returns the typed entity.
 * Fails loudly if sovereignty is compromised.
 */
export function secureCast<T>(moduleId: string, key: string, data: unknown): T {
    const result = validateMutation(moduleId, key, data);
    if (!result.success) {
        throw new Error(`[Nexus Grade X] VALIDATION_BREACH [${moduleId}:${key}]: ${result.errors?.join(', ')}`);
    }
    return data as T;
}
