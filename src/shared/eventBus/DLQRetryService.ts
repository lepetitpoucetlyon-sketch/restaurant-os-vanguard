import { db } from '@/lib/offline/offline-store';
import { NexusEventBus, NexusEventName } from './NexusEventBus';
import { PayloadMigrator } from './PayloadMigrator';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/shared/types/json";
import { toError } from "@/lib/toError";

const MAX_ATTEMPTS = 3;
const SCAN_INTERVAL_MS = 30_000;

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

  logger.info('[DLQRetry] Service démarré — scan toutes les 30s, max 3 tentatives avant quarantaine');
}

export function stopDLQRetryService(): void {
  if (_interval !== null) {
    clearInterval(_interval);
    _interval = null;
  }
}
