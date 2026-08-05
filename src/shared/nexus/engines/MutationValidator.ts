import { SchemaRegistry } from '@/lib/nexus/SchemaRegistry';

/**
 * 🧬 MutationValidator - The Nexus Customs
 * Responsibility: Pure data validation against Zod schemas.
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
