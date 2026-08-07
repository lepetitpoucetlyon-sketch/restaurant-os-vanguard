import type { ITimeclockProvider, ClockEntry } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * Pointage manuel — saisie via l'app (déjà fonctionnel).
 * Lit directement depuis Nexus, pas de webhook entrant.
 */
export class ManualTimeclockProvider implements ITimeclockProvider {
    readonly id = 'manual';

    async fetchEntries(tenantId: string, date: Date): Promise<ClockEntry[]> {
        try {
            const dateStr = date.toISOString().slice(0, 10);
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/timeclock/${dateStr}`) as Record<string, ClockEntry> | null;
            return raw ? Object.values(raw) : [];
        } catch (err) {
            logger.error('[ManualTimeclockProvider] fetchEntries error', toError(err).message);
            return [];
        }
    }

    onWebhook(payload: unknown): ClockEntry {
        return payload as ClockEntry;
    }
}
