/**
 * IDService — Générateur d'identifiants souverains et déterministes.
 *
 * Convention Restaurant OS :
 * - Format : `<prefix>_<timestampBase36>_<randomBase36>` (triable chronologiquement, unique offline)
 * - Exemples : `ord_k9x3q1_8f9a2b`, `je_k9x3q1_4a1c7d`
 */

export class IDService {
    /**
     * Génère un identifiant universel triable avec préfixe optionnel.
     */
    static generate(prefix?: string): string {
        const timePart = Date.now().toString(36);
        const randomPart = Math.random().toString(36).slice(2, 8);
        return prefix ? `${prefix}_${timePart}_${randomPart}` : `${timePart}_${randomPart}`;
    }

    /**
     * Génère une clé d'idempotence pour un événement métier.
     */
    static generateEventId(action: string, entityId?: string): string {
        const base = entityId ? `${action}-${entityId}` : action;
        const timePart = Date.now().toString(36);
        const randomPart = Math.random().toString(36).slice(2, 6);
        return `evt_${base}_${timePart}_${randomPart}`;
    }

    /**
     * Extrait le timestamp approximatif d'un ID généré par IDService.
     */
    static extractTimestamp(id: string): number | null {
        const parts = id.split('_');
        const timeStr = parts.length > 1 ? parts[1] : parts[0];
        const parsed = parseInt(timeStr, 36);
        return isNaN(parsed) ? null : parsed;
    }
}
