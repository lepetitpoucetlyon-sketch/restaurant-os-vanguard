/**
 * Génère un identifiant unique.
 */
export function generateId(prefix: string = ""): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Delay async/await.
 * 
 * @example
 * await sleep(1000); // Attend 1 seconde
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Regroupe un tableau par une clé.
 * 
 * @example
 * groupBy(items, 'category')
 * // { "food": [...], "drinks": [...] }
 */
export function groupBy<T, K extends keyof T>(
    array: T[],
    key: K
): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * Supprime les doublons d'un tableau.
 * 
 * @example
 * unique([1, 2, 2, 3]) // [1, 2, 3]
 * unique(items, 'id') // items uniques par id
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
    if (!key) {
        return [...new Set(array)];
    }
    const seen = new Set();
    return array.filter((item) => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

/**
 * Tri stable par plusieurs clés.
 * 
 * @example
 * sortBy(items, [
 *   { key: 'date', direction: 'desc' },
 *   { key: 'name', direction: 'asc' }
 * ])
 */
export function sortBy<T>(
    array: T[],
    criteria: { key: keyof T; direction?: "asc" | "desc" }[]
): T[] {
    return [...array].sort((a, b) => {
        for (const { key, direction = "asc" } of criteria) {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal === bVal) continue;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            let comparison = 0;
            if (typeof aVal === "string" && typeof bVal === "string") {
                comparison = aVal.localeCompare(bVal);
            } else if (typeof aVal === "number" && typeof bVal === "number") {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }

            if (comparison !== 0) {
                return direction === "asc" ? comparison : -comparison;
            }
        }
        return 0;
    });
}

/**
 * Deep clone un objet.
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Vérifie si un objet est vide.
 */
export function isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
}

/**
 * Omit des clés d'un objet.
 * 
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}

/**
 * Pick des clés d'un objet.
 * 
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Clamp une valeur entre min et max.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Génère un nombre aléatoire entre min et max (inclus).
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sélectionne un élément aléatoire d'un tableau.
 */
export function randomElement<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

/**
 * Mélange un tableau (Fisher-Yates).
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
