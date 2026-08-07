import type { ITimeclockProvider, ClockEntry } from '../types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * Pointage QR Code — l'employé scanne un QR affiché dans l'app sur l'écran entrée.
 * Le scan envoie un POST /api/connectors/timeclock/webhook/qrcode avec le token employé.
 */
export class QrCodeTimeclockProvider implements ITimeclockProvider {
    readonly id = 'qrcode';

    async fetchEntries(tenantId: string, date: Date): Promise<ClockEntry[]> {
        try {
            const dateStr = date.toISOString().slice(0, 10);
            const raw = await Nexus.adapter.get(`tenants/${tenantId}/timeclock/${dateStr}`) as Record<string, ClockEntry> | null;
            return raw ? Object.values(raw).filter(e => e.source === 'qrcode') : [];
        } catch (err) {
            logger.error('[QrCodeTimeclockProvider] fetchEntries error', toError(err).message);
            return [];
        }
    }

    onWebhook(payload: unknown): ClockEntry {
        const body = payload as { employeeId: string; type: string; timestamp?: string };
        return {
            id:         `qr_${body.employeeId}_${Date.now()}`,
            employeeId: body.employeeId,
            type:       (body.type as ClockEntry['type']) ?? 'clock_in',
            timestamp:  body.timestamp ?? new Date().toISOString(),
            source:     'qrcode',
        };
    }
}
