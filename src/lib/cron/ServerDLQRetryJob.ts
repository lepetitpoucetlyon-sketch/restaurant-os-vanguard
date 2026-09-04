import { Nexus } from '@/lib/nexus/NexusAdapter';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';
import type { NexusEventName, NexusEventPayload } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * ServerDLQRetryJob (audit S3)
 *
 * Le `ServerEventBus` persiste les échecs CRITICAL serveur dans
 * `tenants/{id}/dead_letter_events` (status `pending_retry`), MAIS rien ne les
 * rejouait automatiquement — seuls des endpoints admin manuels existaient
 * (contrairement au client qui a `DLQRetryService` toutes les 30s). Ce job
 * ferme le trou : il draine la DLQ serveur à chaque tick cron, avec backoff
 * exponentiel + jitter et mise en quarantaine après 5 tentatives.
 *
 * Sûr grâce à R1 : re-dispatcher l'événement complet ne double pas les effets,
 * les handlers de mutation étant désormais idempotents.
 */

interface ServerDLQEntry {
  id: string;
  eventName: string;
  payload: unknown;
  attempts?: number;
  status?: string;
  nextRetryAt?: number;
}

const MAX_ATTEMPTS = 5;

function backoffMs(attempt: number): number {
  const cap = Math.min(5_000 * Math.pow(2, attempt - 1), 600_000); // plafond 10 min
  return Math.round(cap / 2 + Math.random() * (cap / 2)); // equal jitter (audit S6)
}

export const ServerDLQRetryJob = {
  name: 'ServerDLQRetryJob',
  schedule: '*/5 * * * *',
  async runForTenant(tenantId: string): Promise<void> {
    const path = `tenants/${tenantId}/dead_letter_events`;
    const entries = await Nexus.adapter.query<ServerDLQEntry>(path);
    if (!entries?.length) return;

    const now = Date.now();
    for (const entry of entries) {
      if (entry.status !== 'pending_retry') continue;
      if (entry.nextRetryAt && entry.nextRetryAt > now) continue;

      const attempts = (entry.attempts ?? 1) + 1;
      try {
        await dispatchServerEvent(
          entry.eventName as NexusEventName,
          entry.payload as NexusEventPayload<NexusEventName>,
        );
        await Nexus.adapter.delete(`${path}/${entry.id}`);
        logger.info(`[ServerDLQRetry] ✅ ${entry.eventName} rejoué (tenant ${tenantId}, tentative ${attempts})`);
      } catch (err) {
        const willQuarantine = attempts >= MAX_ATTEMPTS;
        await Nexus.adapter.update(`${path}/${entry.id}`, {
          attempts,
          status: willQuarantine ? 'quarantine' : 'pending_retry',
          nextRetryAt: now + backoffMs(attempts),
          lastError: toError(err).message,
          failedAt: now,
        });
        logger.warn(
          `[ServerDLQRetry] ❌ ${entry.eventName} tenant ${tenantId} — tentative ${attempts}/${MAX_ATTEMPTS}` +
            (willQuarantine ? ' → QUARANTAINE' : ''),
        );
      }
    }
  },
};
