import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useCallback } from 'react';
import { dlqQuarantineEntriesAtom } from '@/store/atoms/dlqQuarantine.atom';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { db } from '@/lib/offline/offline-store';
import { logger } from '@/lib/logger';

/**
 * useDLQQuarantine — hook réactif pour le dashboard MCC.
 *
 * • Écoute les événements `mcc.dlq_quarantine` en temps réel
 * • Charge les entrées quarantinées depuis IndexedDB au montage
 * • Expose `replayEntry(id)` pour retenter manuellement un event
 */
export function useDLQQuarantine() {
  const entries = useAtomValue(dlqQuarantineEntriesAtom);
  const setEntries = useSetAtom(dlqQuarantineEntriesAtom);

  // Charger les entrées quarantinées depuis IndexedDB au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadQuarantined = async () => {
      try {
        const quarantined = await db.deadLetterEvents
          .where('status').equals('quarantine')
          .toArray();
        setEntries(quarantined.map(e => ({
          tenantId: (e.payload as Record<string, unknown>)?.tenantId as string ?? 'unknown',
          eventName: e.eventName,
          handlerId: e.handlerId,
          attempts: e.attempts,
          lastError: e.error,
          quarantinedAt: e.failedAt,
        })));
      } catch (err) {
        logger.error('[useDLQQuarantine] Échec du chargement IndexedDB', err);
      }
    };

    loadQuarantined();
  }, [setEntries]);

  // Écouter les nouvelles quarantaines en temps réel
  useEffect(() => {
    const unsub = NexusEventBus.on(
      'mcc.dlq_quarantine',
      async (payload) => {
        setEntries(prev => [...prev, payload]);
      },
      { id: 'use-dlq-quarantine-hook', priority: 'BACKGROUND' }
    );
    return unsub;
  }, [setEntries]);

  // Fonction de replay manuel
  const replayEntry = useCallback(async (entryId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const entry = await db.deadLetterEvents.get(entryId);
      if (!entry) return;

      await db.deadLetterEvents.update(entryId, {
        status: 'retry',
        attempts: 0,
        nextRetryAt: Date.now(),
      });

      setEntries(prev => prev.filter(e =>
        !(e.eventName === entry.eventName && e.handlerId === entry.handlerId && e.quarantinedAt === entry.failedAt)
      ));

      logger.info(`[useDLQQuarantine] Event ${entry.eventName}#${entry.handlerId} remis en file de retry`);
    } catch (err) {
      logger.error('[useDLQQuarantine] Échec du replay', err);
    }
  }, [setEntries]);

  return { entries, replayEntry };
}
