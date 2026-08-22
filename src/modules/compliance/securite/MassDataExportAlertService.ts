/**
 * L56 — Alerte consultation en masse fiches clients.
 *
 * Un salarié démissionnaire peut exporter 5 000 fiches VIP avant de partir —
 * exfiltration RGPD sans aucun signal d'alarme. Solution : rate-limit sur les
 * consultations / exports de fiches clients avec alerte automatique dès
 * dépassement du seuil dans une fenêtre glissante.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L56 (HAUT — exfiltration RGPD).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

const DEFAULT_THRESHOLD = 200;
const DEFAULT_WINDOW_MS = 3600_000; // 1h

export interface ExportCheckInput {
  tenantId: string;
  actorId: string;
  resourceType: 'customers' | 'loyaltyAccounts' | 'reservations' | string;
  count: number;
  threshold?: number;
  windowMs?: number;
  now?: number;
}

export class MassDataExportAlertService {
  private static counterPath(tenantId: string, actorId: string, resource: string): string {
    return `tenants/${tenantId}/export_counters/${actorId}_${resource}`;
  }

  static async check(input: ExportCheckInput): Promise<{ alerted: boolean; cumulativeCount: number }> {
    const now = input.now ?? Date.now();
    const threshold = input.threshold ?? DEFAULT_THRESHOLD;
    const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS;
    const path = this.counterPath(input.tenantId, input.actorId, input.resourceType);

    const existing = await Nexus.adapter.get<{ count: number; windowStart: number }>(path);
    let count = input.count;
    let windowStart = now;

    if (existing && now - existing.windowStart < windowMs) {
      count += existing.count;
      windowStart = existing.windowStart;
    }

    await Nexus.adapter.set(path, { count, windowStart });

    if (count >= threshold) {
      await AuditLogger.logAction(
        input.actorId,
        'MASS_DATA_EXPORT_ALERT',
        `${input.resourceType}_export`,
        { count, threshold, resourceType: input.resourceType },
      ).catch(() => null);

      await NexusEventBus.emit('security.mass_data_export_alert', {
        v: 1,
        tenantId: input.tenantId,
        actorId: input.actorId,
        exportedCount: count,
        thresholdCount: threshold,
        resourceType: input.resourceType,
        alertedAt: now,
      });

      return { alerted: true, cumulativeCount: count };
    }

    return { alerted: false, cumulativeCount: count };
  }
}
