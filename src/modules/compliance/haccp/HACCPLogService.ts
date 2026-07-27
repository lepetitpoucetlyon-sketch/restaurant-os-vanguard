import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { SensorReading } from '@/domain/schemas/haccp';

/**
 * HACCPLogService — backend du registre sanitaire (hac-6).
 *
 * Trois collections, deux régimes de mutabilité :
 *
 *  1. iotHistory/{sensorId}_{ts}   → historique des relevés de température,
 *     APPEND-ONLY et IMMUABLE (registre auditable, jamais écrasé ni modifié).
 *
 *  2. haccpLogs/{id}               → journal officiel des ÉVÉNEMENTS de
 *     non-conformité, IMMUABLE (write-once). Preuve inaltérable pour les
 *     services d'inspection.
 *
 *  3. nonConformities/{id}         → dossier MUTABLE de suivi de l'action
 *     corrective. C'est la MÊME collection que celle lue par le manager dans
 *     NonConformityForm : une non-conformité détectée par une sonde apparaît
 *     donc directement dans sa liste (statut 'open') et s'y résout.
 */

export type ConformityStatus = 'CONFORM' | 'NON_CONFORM';
export type HACCPSeverity = 'minor' | 'major' | 'critical';

export interface HACCPLogEntry {
  id: string;
  type: 'NON_CONFORMITY';
  tenantId: string;
  sensorId?: string;
  temperature?: number;
  status: ConformityStatus;
  severity: HACCPSeverity;
  description: string;
  nonConformityId: string;
  recordedAt: string; // ISO
  source?: string;
}

export interface RecordNonConformityInput {
  tenantId: string;
  /** Type au format du registre manager (ex. 'température hors norme'). */
  ncType: string;
  severity: HACCPSeverity;
  description: string;
  correctiveAction?: string;
  responsible?: string;
  sensorId?: string;
  temperature?: number;
  source?: string;
}

export const HACCPLogService = {
  /**
   * Historique IMMUABLE d'un relevé de température (append-only).
   * Une clé unique {sensorId}_{ts} garantit un create — jamais un écrasement.
   */
  async appendTemperatureHistory(reading: SensorReading, status: ConformityStatus): Promise<void> {
    await Nexus.adapter.set(
      `tenants/${reading.tenantId}/iotHistory/${reading.sensorId}_${reading.timestamp}`,
      {
        sensorId: reading.sensorId,
        temperature: reading.temperature,
        humidity: reading.humidity ?? null,
        battery: reading.battery ?? null,
        status,
        source: reading.source,
        timestamp: reading.timestamp,
        recordedAt: new Date(reading.timestamp).toISOString(),
      },
    );
  },

  /**
   * Enregistre une non-conformité sanitaire :
   *  - haccpLogs      : événement IMMUABLE (registre officiel, jamais modifiable)
   *  - nonConformities: dossier de suivi (visible + résoluble dans NonConformityForm)
   * Retourne l'id du dossier de non-conformité.
   */
  async recordNonConformity(input: RecordNonConformityInput): Promise<string> {
    const now = new Date().toISOString();
    const logPath = `tenants/${input.tenantId}/haccpLogs`;
    const ncPath = `tenants/${input.tenantId}/nonConformities`;
    const logId = Nexus.adapter.generateId(logPath);
    const ncId = Nexus.adapter.generateId(ncPath);

    // 1. Journal IMMUABLE (write-once — SovereignGuard + firestore.rules interdisent update/delete).
    const logEntry: HACCPLogEntry = {
      id: logId,
      type: 'NON_CONFORMITY',
      tenantId: input.tenantId,
      sensorId: input.sensorId,
      temperature: input.temperature,
      status: 'NON_CONFORM',
      severity: input.severity,
      description: input.description,
      nonConformityId: ncId,
      recordedAt: now,
      source: input.source,
    };
    await Nexus.adapter.set(`${logPath}/${logId}`, logEntry as unknown as Record<string, unknown>);

    // 2. Dossier de suivi — MÊME forme que celle attendue par NonConformityForm,
    //    pour apparaître dans la liste du manager et y être résolu.
    await Nexus.adapter.set(`${ncPath}/${ncId}`, {
      id: ncId,
      type: input.ncType,
      description: input.description,
      correctiveAction: input.correctiveAction
        ?? 'Isolement immédiat des denrées, contrôle de l\'enceinte et relance technicien si nécessaire.',
      responsible: input.responsible ?? 'Système IoT (auto)',
      date: now.split('T')[0],
      status: 'open',
      createdAt: Date.now(),
      // Traçabilité additionnelle (lien vers le journal immuable + contexte sonde).
      severity: input.severity,
      sensorId: input.sensorId ?? null,
      temperature: input.temperature ?? null,
      haccpLogId: logId,
    });

    logger.warn(`[HACCP] Non-conformité (${input.severity}) enregistrée : ${input.description}`);
    return ncId;
  },
};
