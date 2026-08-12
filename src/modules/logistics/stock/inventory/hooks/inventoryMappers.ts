import { SovereignNode, SovereignField } from "@nexus/contracts/nexus-contract";
import { Ingredient, IngredientUnit, IngredientCategory } from "@nexus/contracts/logistics";

/**
 * 🛡️ SOVEREIGN MAPPING (Grade X) — pure, hors hook.
 * Projette un SovereignNode brut en Ingredient typé (avec fallbacks sûrs).
 * `now` est injecté pour rester pur (pas de `new Date()` interne).
 */
export function mapNodeToIngredient(n: SovereignNode, now: string): Ingredient {
    const attr = (n.attributes || {}) as Record<string, SovereignField>;
    return {
        id: String(n.id),
        name: String(attr.name || ''),
        unit: (attr.unit || 'unit') as IngredientUnit,
        minQuantity: Number(attr.minQuantity || 0),
        costInCents: Number(attr.costInCents || 0),
        costInMicrounits: Number(attr.costInMicrounits || (Number(attr.costInCents || 0) * 10_000)),
        category: (attr.category || 'other') as IngredientCategory,
        supplier: String(attr.supplier || ''),
        defaultStorageLocation: String(attr.defaultStorageLocation || ''),
        createdAt: typeof n.createdAt === 'string' ? n.createdAt : now,
        updatedAt: now
    } as Ingredient;
}
