/**
 * L55 + MCC-C4 — Détection automatique d'anomalie hash chaîne fiscale.
 *
 * Job périodique (à câbler dans `src/lib/cron/`) qui :
 *   1. Charge tous les logs audit depuis la dernière vérification
 *   2. Appelle `AuditLogger.verifyChain(logs)` pour détecter les ruptures
 *   3. Émet `crypto.integrity_failed` et logge `FISCAL_SEAL_ANOMALY_DETECTED`
 *      pour CHAQUE break, avec l'ID du log qui casse la chaîne + le hash attendu.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L55 / MCC-C4 (débloqué par ADR-014).
 */
import { AuditLogger, type AuditLog } from './AuditLogger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export interface AnomalyDetectionResult {
  checkedAt: number;
  logsScanned: number;
  breaks: Array<{ id: string; expectedPrev: string; actualPrev: string }>;
  emittedEvents: number;
}

export class FiscalChainAnomalyDetector {
  /**
   * Analyse une liste de logs et déclenche les alertes pour chaque rupture.
   * `tenantId` est utilisé pour le contexte de l'event (une flotte MCC peut avoir
   * plusieurs chaînes — l'appelant en batch une par tenant).
   */
  static async detectAnomalies(
    tenantId: string,
    logs: AuditLog[],
  ): Promise<AnomalyDetectionResult> {
    const result = await AuditLogger.verifyChain(logs);
    let emitted = 0;

    for (const brk of result.breaks) {
      try {
        await NexusEventBus.emit('crypto.integrity_failed', {
          v: 1,
          tenantId,
          journalId: brk.id,
          expectedHash: brk.expectedPrev,
          actualHash: brk.actualPrev,
          detectedAt: Date.now(),
        });
        emitted++;
      } catch (err) {
        logger.warn('[FiscalChainAnomalyDetector] emit failed', err);
      }

      await AuditLogger.logAction(
        'system:fiscal_chain_scanner',
        'FISCAL_SEAL_ANOMALY_DETECTED',
        brk.id,
        {
          expectedPrev: brk.expectedPrev,
          actualPrev: brk.actualPrev,
          tenantId,
        },
      ).catch(() => null);
    }

    return {
      checkedAt: Date.now(),
      logsScanned: logs.length,
      breaks: result.breaks,
      emittedEvents: emitted,
    };
  }
}
