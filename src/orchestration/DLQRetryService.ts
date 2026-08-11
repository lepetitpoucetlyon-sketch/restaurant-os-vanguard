import { db } from '@/lib/offline/offline-store';
import { NexusEventBus, NexusEventName } from '@/shared/eventBus/NexusEventBus';
import { PayloadMigrator } from './PayloadMigrator';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/shared/types/json";
import { toError } from "@/lib/toError";

const MAX_ATTEMPTS = 5;           // Enterprise grade : 5 tentatives avant quarantaine
const SCAN_INTERVAL_MS = 30_000;

/**
 * Events dont l'échec définitif requiert un audit fiscal NF525.
 * Correspond aux handlers CRITICAL qui scellent la chaîne fiscale.
 */
const FISCAL_CRITICAL_EVENTS = new Set([
  'order.sealed_nf525',
  'order.completed',
  'order.cancelled',
  'payment.captured',
  'payment.refunded',
  'fiscal.seal_required',
]);

/**
 * Calcule le délai de backoff exponentiel plafonné à 60s.
 * tentative 1 → 2s, 2 → 4s, 3+ → quarantaine (jamais re-tenté).
 */
function backoffMs(attempt: number): number {
  return Math.min(2_000 * Math.pow(2, attempt - 1), 60_000);
}

async function processRetryQueue(): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const candidates = await db.deadLetterEvents
    .where('status').equals('retry')
    .toArray();

  const due = candidates.filter(e => e.nextRetryAt <= now);
  if (due.length === 0) return;

  logger.info(`[DLQRetry] ${due.length} événement(s) à rejouer`);

  for (const entry of due) {
    const newAttempts = entry.attempts + 1;
    const willQuarantine = newAttempts >= MAX_ATTEMPTS;

    try {
      const migratedPayload = PayloadMigrator.migrate(
        entry.eventName as NexusEventName,
        entry.payload as JsonObject
      );
      // skipDLQWrite : on gère l'état DLQ ici, pas dans le bus
      await NexusEventBus.emit(
        entry.eventName as NexusEventName,
        migratedPayload,
        { skipDLQWrite: true }
      );
      await db.deadLetterEvents.delete(entry.id);
      logger.info(`[DLQRetry] ✅ ${entry.eventName}#${entry.handlerId} replayé (tentative ${newAttempts})`);
    } catch (err) {
      await db.deadLetterEvents.update(entry.id, {
        attempts: newAttempts,
        status: willQuarantine ? 'quarantine' : 'retry',
        nextRetryAt: Date.now() + backoffMs(newAttempts),
        error: `[retry ${newAttempts}/${MAX_ATTEMPTS}] ${toError(err).message}`,
        failedAt: Date.now(),
      });

      if (willQuarantine) {
        // Alerte MCC : un event est définitivement en quarantaine
        const tenantId = (entry.payload as Record<string, unknown>)?.tenantId as string ?? 'unknown';
        NexusEventBus.emit('mcc.dlq_quarantine', {
          tenantId,
          eventName: entry.eventName,
          handlerId: entry.handlerId,
          attempts: newAttempts,
          lastError: toError(err).message,
          quarantinedAt: Date.now(),
        }).catch(e => logger.error('[DLQRetry] Failed to emit quarantine alert', e));

        // Si l'événement est fiscal/NF525 → escalade audit obligatoire
        if (FISCAL_CRITICAL_EVENTS.has(entry.eventName)) {
          NexusEventBus.emit('mcc.fiscal_audit_required', {
            tenantId,
            reason: `DLQ quarantine: ${entry.eventName}#${entry.handlerId} — ${newAttempts} tentatives échouées. Intégrité fiscale NF525 à vérifier manuellement.`,
            urgency: 'critical',
          }).catch(e => logger.error('[DLQRetry] Failed to emit fiscal audit alert', e));
          logger.error(
            `[DLQRetry] 🚨 FISCAL AUDIT REQUIRED — ${entry.eventName} en quarantaine après ${newAttempts} tentatives (tenant: ${tenantId})`
          );
        }
      }

      logger.warn(
        `[DLQRetry] ❌ ${entry.eventName}#${entry.handlerId} — ` +
        `tentative ${newAttempts}/${MAX_ATTEMPTS}` +
        (willQuarantine ? ' → QUARANTAINE' : ` → retry dans ${backoffMs(newAttempts) / 1000}s`)
      );
    }
  }
}

let _interval: ReturnType<typeof setInterval> | null = null;

/**
 * Démarre le service de retry DLQ.
 * Idempotent — safe à appeler plusieurs fois.
 * Lance un premier scan immédiat au boot pour traiter les entrées
 * laissées en 'retry' par une session précédente.
 */
export function startDLQRetryService(): void {
  if (typeof window === 'undefined') return;
  if (_interval !== null) return;

  processRetryQueue().catch(err =>
    logger.error('[DLQRetry] Scan initial échoué', err)
  );

  _interval = setInterval(() => {
    processRetryQueue().catch(err =>
      logger.error('[DLQRetry] Scan périodique échoué', err)
    );
  }, SCAN_INTERVAL_MS);

  logger.info('[DLQRetry] Service démarré — scan toutes les 30s, max 5 tentatives avant quarantaine (fiscal: 6 events surveillés)');
}

export function stopDLQRetryService(): void {
  if (_interval !== null) {
    clearInterval(_interval);
    _interval = null;
  }
}
