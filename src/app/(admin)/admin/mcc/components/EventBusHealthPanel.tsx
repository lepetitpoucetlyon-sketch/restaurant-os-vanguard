import React, { useEffect, useState } from 'react';
import { db, DeadLetterEntry } from '@/lib/offline/offline-store';
import { NexusEventBus, NexusEventName } from '@/shared/eventBus/NexusEventBus';
import { PayloadMigrator } from '@/shared/eventBus/PayloadMigrator';
import { Button } from '@/shared/components/ui';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";
import { toError } from "@/lib/toError";

/**
 * 🛠️ EventBusHealthPanel - MCC
 * Permet de monitorer la santé du bus d'événements et de gérer la Dead Letter Queue (DLQ).
 * Affiche les événements en échec (retry pending) et en quarantaine.
 */
export const EventBusHealthPanel: React.FC = () => {
  const [dlqEvents, setDlqEvents] = useState<DeadLetterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDlq = async () => {
    try {
      const events = await db.deadLetterEvents.toArray();
      setDlqEvents(events.sort((a, b) => b.failedAt - a.failedAt));
    } catch (err) {
      logger.error('[EventBusHealthPanel] Failed to load DLQ', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDlq();
    // Rafraîchissement régulier
    const interval = setInterval(fetchDlq, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (entry: DeadLetterEntry) => {
    const MAX_ATTEMPTS = 3;
    const newAttempts = entry.attempts + 1;
    try {
      logger.info(`[EventBusHealthPanel] Retrying event ${entry.eventName}#${entry.id} (attempt ${newAttempts})`);

      const migratedPayload = PayloadMigrator.migrate(entry.eventName as NexusEventName, entry.payload as JsonObject);
      // skipDLQWrite: on gère l'état DLQ ici, pas dans le bus, pour éviter attempts=1
      await NexusEventBus.emit(entry.eventName as NexusEventName, migratedPayload, { skipDLQWrite: true });

      // Succès : supprimer de la DLQ
      await db.deadLetterEvents.delete(entry.id);
    } catch (err) {
      logger.error(`[EventBusHealthPanel] Retry failed for ${entry.id}`, err);
      // Échec : incrémenter attempts in-place, quarantaine si seuil atteint
      await db.deadLetterEvents.update(entry.id, {
        attempts: newAttempts,
        status: newAttempts >= MAX_ATTEMPTS ? 'quarantine' : 'retry',
        nextRetryAt: Date.now() + Math.min(2_000 * Math.pow(2, newAttempts - 1), 60_000),
        error: `[manual retry ${newAttempts}/${MAX_ATTEMPTS}] ${toError(err).message}`,
        failedAt: Date.now(),
      });
    } finally {
      await fetchDlq();
    }
  };

  const handleQuarantine = async (id: string) => {
    try {
      await db.deadLetterEvents.update(id, { status: 'quarantine' });
      await fetchDlq();
    } catch (err) {
      logger.error(`[EventBusHealthPanel] Failed to quarantine ${id}`, err);
    }
  };
  
  const handlePurge = async () => {
    if (confirm('Voulez-vous purger toute la DLQ ? Les événements seront perdus.')) {
      await db.deadLetterEvents.clear();
      await fetchDlq();
    }
  };

  if (loading) {
    return <div className="p-4 text-text-muted font-mono text-sm">Loading DLQ...</div>;
  }

  return (
    <div className="p-6 bg-surface-card rounded-2xl text-text-primary shadow-xl border border-red-900/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-mono text-red-400 flex items-center gap-2">
          <span>📡</span> Event Bus Health & DLQ
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDlq} className="border-border-default text-text-secondary">
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={handlePurge}>
            Purge All
          </Button>
        </div>
      </div>

      {dlqEvents.length === 0 ? (
        <div className="p-8 text-center text-text-muted font-mono border border-border-default border-dashed rounded-xl bg-surface-glass">
          Aucun événement dans la Dead Letter Queue. Le bus est sain.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono border-collapse">
            <thead>
              <tr className="border-b border-border-default text-text-muted">
                <th className="py-3 px-4 font-semibold">Event / Handler</th>
                <th className="py-3 px-4 font-semibold">Error</th>
                <th className="py-3 px-4 font-semibold">Attempts</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dlqEvents.map((entry) => (
                <tr key={entry.id} className="border-b border-border-default/40 hover:bg-surface-glass-hover transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-yellow-500">{entry.eventName}</div>
                    <div className="text-xs text-text-muted mt-1">{entry.handlerId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="truncate max-w-[15.625rem] text-red-400" title={entry.error}>
                      {entry.error}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {new Date(entry.failedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-surface-glass border border-border-default px-2 py-1 rounded text-text-secondary">
                      {entry.attempts} / 3
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      entry.status === 'quarantine' ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                    {entry.status !== 'quarantine' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-yellow-700/50 hover:bg-yellow-900/30"
                        onClick={() => handleRetry(entry)}
                      >
                        Retry
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-red-700/50 hover:bg-red-900/30"
                      onClick={() => handleQuarantine(entry.id)}
                      disabled={entry.status === 'quarantine'}
                    >
                      Quarantine
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
