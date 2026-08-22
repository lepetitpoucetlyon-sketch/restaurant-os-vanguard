/**
 * MCC-C2 — Rétention 6 ans WORM enforcée (Art. 102 LPF).
 *
 * Article 102 du Livre des Procédures Fiscales : les documents comptables
 * et fiscaux doivent être conservés 6 ans. Actuellement, une purge manuelle
 * ou un script peut supprimer des archives < 6 ans sans blocage backend.
 *
 * Ce service expose `canPurge(createdAt)` qui vérifie le délai légal et
 * `assertPurgeAllowed(createdAt)` qui lève une exception si la purge est interdite.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-C2 (HAUT — Art. 102 LPF).
 */
import { AuditLogger } from '@/modules/compliance';

const RETENTION_YEARS = 6;
const RETENTION_MS = RETENTION_YEARS * 365.25 * 24 * 3600_000;

export interface RetentionCheckResult {
  allowed: boolean;
  createdAt: number;
  retentionExpireAt: number;
  remainingMs: number;
  legalRef: 'Art. 102 LPF';
}

export class WormRetentionEnforcer {
  static check(createdAt: number, now?: number): RetentionCheckResult {
    const ts = now ?? Date.now();
    const retentionExpireAt = createdAt + RETENTION_MS;
    const remainingMs = retentionExpireAt - ts;
    return {
      allowed: ts >= retentionExpireAt,
      createdAt,
      retentionExpireAt,
      remainingMs: Math.max(0, remainingMs),
      legalRef: 'Art. 102 LPF',
    };
  }

  static async assertPurgeAllowed(input: {
    resourceId: string;
    resourceType: string;
    createdAt: number;
    requestedBy: string;
    now?: number;
  }): Promise<RetentionCheckResult> {
    const result = this.check(input.createdAt, input.now);

    if (!result.allowed) {
      await AuditLogger.logAction(
        input.requestedBy,
        'PURGE_BLOCKED_WORM',
        input.resourceId,
        {
          resourceType: input.resourceType,
          createdAt: input.createdAt,
          retentionExpireAt: result.retentionExpireAt,
          remainingMs: result.remainingMs,
          legalRef: 'Art. 102 LPF',
        },
      ).catch(() => null);

      const remainingYears = (result.remainingMs / (365.25 * 24 * 3600_000)).toFixed(1);
      throw new Error(
        `WORM_RETENTION_BLOCKED: purge de "${input.resourceId}" refusée — délai légal 6 ans non expiré (reste ${remainingYears} ans). Réf: Art. 102 LPF`,
      );
    }

    return result;
  }
}
