import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export interface IdempotencyLeaseRecord {
  id: string; // `${eventId}_${handlerId}`
  eventId: string;
  handlerId: string;
  eventName: string;
  tenantId: string;
  status: 'leased' | 'completed' | 'failed';
  leasedAt: number;
  expiresAt: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
}

export interface LeaseAcquisitionResult {
  acquired: boolean;
  reason?: 'already_completed' | 'already_leased' | 'error';
  record?: IdempotencyLeaseRecord;
}

/**
 * 🔒 ServerIdempotencyPersistence (Audit P0 / Phase 2)
 *
 * Primitive de réservation persistante et atomique multi-worker pour (tenantId, eventId, handlerId).
 * Élimine la course "check-then-act" via une transaction Firestore / Nexus.
 */
export class ServerIdempotencyPersistence {
  static getDocumentPath(tenantId: string, eventId: string, handlerId: string): string {
    const safeKey = `${eventId}_${handlerId}`.replace(/[\/\s#?]/g, '_');
    return `tenants/${tenantId}/events_processed_log/${safeKey}`;
  }

  private static checkExistingLease(
    existing: IdempotencyLeaseRecord | null | undefined,
    now: number,
  ): LeaseAcquisitionResult | null {
    if (!existing) return null;
    if (existing.status === 'completed') {
      return { acquired: false, reason: 'already_completed', record: existing };
    }
    if (existing.status === 'leased' && now < existing.expiresAt) {
      return { acquired: false, reason: 'already_leased', record: existing };
    }
    return null;
  }

  private static buildLeaseRecord(
    eventId: string,
    handlerId: string,
    eventName: string,
    tenantId: string,
    now: number,
    ttlMs: number,
  ): IdempotencyLeaseRecord {
    return {
      id: `${eventId}_${handlerId}`,
      eventId,
      handlerId,
      eventName,
      tenantId,
      status: 'leased',
      leasedAt: now,
      expiresAt: now + ttlMs,
    };
  }

  private static async acquireViaTransaction(
    path: string,
    record: IdempotencyLeaseRecord,
    now: number,
  ): Promise<LeaseAcquisitionResult> {
    return await Nexus.adapter.runTransaction<LeaseAcquisitionResult>(async (tx) => {
      const existing = await tx.get<IdempotencyLeaseRecord>(path);
      const conflict = this.checkExistingLease(existing, now);
      if (conflict) return conflict;

      if (typeof tx.set === 'function') {
        tx.set(path, record);
      } else if (typeof tx.update === 'function') {
        tx.update(path, record);
      }
      return { acquired: true, record };
    });
  }

  private static async acquireViaDirectAdapter(
    path: string,
    record: IdempotencyLeaseRecord,
    now: number,
  ): Promise<LeaseAcquisitionResult> {
    const existing = await Nexus.adapter.get<IdempotencyLeaseRecord>(path);
    const conflict = this.checkExistingLease(existing, now);
    if (conflict) return conflict;

    await Nexus.adapter.set(path, record);
    return { acquired: true, record };
  }

  /**
   * Tente d'acquérir atomiquement un bail d'exécution pour (tenantId, eventId, handlerId).
   */
  static async acquireLease(
    eventId: string,
    handlerId: string,
    eventName: string,
    tenantId: string,
    ttlMs: number = 60_000,
  ): Promise<LeaseAcquisitionResult> {
    if (!eventId || !tenantId) {
      return { acquired: true };
    }

    const path = this.getDocumentPath(tenantId, eventId, handlerId);
    const now = Date.now();
    const newRecord = this.buildLeaseRecord(eventId, handlerId, eventName, tenantId, now, ttlMs);

    try {
      if (typeof Nexus.adapter?.runTransaction === 'function') {
        return await this.acquireViaTransaction(path, newRecord, now);
      }
      return await this.acquireViaDirectAdapter(path, newRecord, now);
    } catch (err) {
      logger.error(
        `[ServerIdempotencyPersistence] Échec critique acquisition bail pour ${eventId}#${handlerId} (fail-closed)`,
        toError(err).message,
      );
      return { acquired: false, reason: 'error' };
    }
  }

  /**
   * Marque l'exécution comme terminée avec succès.
   */
  static async completeLease(
    eventId: string,
    handlerId: string,
    eventName: string,
    tenantId: string,
  ): Promise<void> {
    if (!eventId || !tenantId) return;
    const path = this.getDocumentPath(tenantId, eventId, handlerId);
    const now = Date.now();

    try {
      const record: IdempotencyLeaseRecord = {
        id: `${eventId}_${handlerId}`,
        eventId,
        handlerId,
        eventName,
        tenantId,
        status: 'completed',
        leasedAt: now,
        expiresAt: now + 365 * 24 * 3600 * 1000,
        completedAt: now,
      };
      await Nexus.adapter.set(path, record, { merge: true });
    } catch (err) {
      logger.warn(`[ServerIdempotencyPersistence] Échec clôture bail pour ${eventId}#${handlerId}`, toError(err).message);
    }
  }

  /**
   * Marque le bail en échec afin de permettre un rejeu immédiat ou DLQ.
   */
  static async failLease(
    eventId: string,
    handlerId: string,
    _eventName: string,
    tenantId: string,
    error: Error | string,
  ): Promise<void> {
    if (!eventId || !tenantId) return;
    const path = this.getDocumentPath(tenantId, eventId, handlerId);
    const now = Date.now();

    try {
      await Nexus.adapter.set(
        path,
        {
          status: 'failed',
          failedAt: now,
          error: typeof error === 'string' ? error : error.message,
        },
        { merge: true },
      );
    } catch (err) {
      logger.warn(`[ServerIdempotencyPersistence] Échec marquage échec bail pour ${eventId}#${handlerId}`, toError(err).message);
    }
  }
}
