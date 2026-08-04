import { Order } from "@nexus/contracts";

const ALLERGEN_REGEX = /allergi|allergen|intolér/i;

export function hasAllergens(items: Order['items']): string[] {
    const found: string[] = [];
    for (const item of items) {
        for (const mod of item.modifiers ?? []) {
            const modStr = typeof mod === 'string' ? mod : mod.name;
            if (ALLERGEN_REGEX.test(modStr)) found.push(modStr);
        }
        const extra = item as unknown as { allergens?: unknown };
        if (Array.isArray(extra.allergens)) {
            for (const a of extra.allergens) {
                if (typeof a === 'string' && a) found.push(a);
            }
        } else if (typeof extra.allergens === 'string' && extra.allergens) {
            found.push(extra.allergens);
        }
    }
    return [...new Set(found)];
}
