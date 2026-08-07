import { Order } from "@nexus/contracts";

const ALLERGEN_REGEX = /allergi|allergen|intolér/i;

export function isTicketWarning(status: string, elapsedMinutes: number): boolean {
    return status !== 'ready' && elapsedMinutes >= 8 && elapsedMinutes < 15;
}

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

export function formatElapsed(totalSeconds: number): string {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.max(0, totalSeconds) % 60;
    return `${m}m ${s}s`;
}

export function timerColorClass(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 5) return "text-status-success";
    if (minutes < 10) return "text-orange-400";
    return "text-status-danger animate-pulse";
}
