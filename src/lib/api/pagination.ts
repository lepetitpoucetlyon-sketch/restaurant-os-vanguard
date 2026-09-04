import { z } from 'zod';

/**
 * Pagination cursor-based (audit S7).
 *
 * `limit` : nombre max d'items retournés (défaut 50, plafond 500).
 * `cursor` : opaque, identifie l'item après lequel reprendre (typiquement l'`id`
 *           du dernier item de la page précédente).
 *
 * Sans pagination, les routes de liste chargent l'INTÉGRALITÉ d'une collection
 * en mémoire → latence + coût qui grossissent avec la donnée du tenant.
 *
 * Ce helper NE dépend d'AUCUN provider (pas de Firestore-only) : les routes
 * appliquent la coupe côté serveur après `Nexus.adapter.query(...)`. Pour un
 * provider natif à curseur (Firestore `startAfter`), l'appelant peut passer le
 * cursor directement.
 */

export const PaginationQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(500).optional().default(50),
    cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface Paginated<T> {
    items: T[];
    nextCursor: string | null;
    /** Nombre TOTAL avant pagination (sur ce jeu chargé), utile pour l'UI. */
    total: number;
}

/**
 * Parse `?limit=&cursor=` depuis une `Request` avec validation Zod.
 * Retourne les défauts si les paramètres sont absents.
 */
export function parsePaginationParams(url: URL | string): PaginationQuery {
    const u = typeof url === 'string' ? new URL(url) : url;
    const raw: Record<string, string> = {};
    const limit = u.searchParams.get('limit');
    const cursor = u.searchParams.get('cursor');
    if (limit !== null) raw.limit = limit;
    if (cursor !== null) raw.cursor = cursor;
    const parsed = PaginationQuerySchema.safeParse(raw);
    if (!parsed.success) return { limit: 50 };
    return parsed.data;
}

/**
 * Coupe côté serveur d'un tableau déjà chargé, avec cursor = id de l'item après
 * lequel reprendre. Convient à Nexus (mock/Firestore/Simulacra) puisque la
 * pagination interne provider-native peut être branchée séparément.
 *
 * `getId` : fonction d'extraction de l'id d'un item (défaut : `item.id`).
 */
export function paginateAfterId<T>(
    items: readonly T[],
    query: PaginationQuery,
    getId: (item: T) => string | undefined = (i) => (
        typeof i === 'object' && i !== null && 'id' in i && typeof i.id === 'string'
            ? i.id
            : undefined
    ),
): Paginated<T> {
    let startIdx = 0;
    if (query.cursor) {
        const idx = items.findIndex((it) => getId(it) === query.cursor);
        if (idx >= 0) startIdx = idx + 1;
    }
    const slice = items.slice(startIdx, startIdx + query.limit);
    const nextIdx = startIdx + query.limit;
    const nextCursor = nextIdx < items.length ? (getId(items[nextIdx - 1]) ?? null) : null;
    return { items: slice, nextCursor, total: items.length };
}
