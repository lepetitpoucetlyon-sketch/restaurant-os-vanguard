import { z } from 'zod';

/**
 * 🧬 SchemaRegistry - The Nexus Customs
 * Stores and provides validation schemas for all modules.
 */
export const SchemaRegistry: Record<string, Record<string, z.ZodSchema>> = {
    ACCOUNTING: {
        journalEntries: z.object({
            pieceNumber: z.string().min(1),
            description: z.string(),
            amountInCents: z.number().int(),
            type: z.enum(['revenue', 'expense', 'tax', 'bank', 'payroll', 'other']),
            isValidated: z.boolean().optional()
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
export function validateMutation(moduleId: string, key: string, data: SovereignData | SovereignValue) {

    const schema = SchemaRegistry[moduleId]?.[key];
    if (!schema) return { success: true }; // No schema = warning but pass in Phase 1

    const result = schema.safeParse(data);
    if (!result.success) {
        return { 
            success: false, 
            errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        };
    }
    return { success: true };
}
