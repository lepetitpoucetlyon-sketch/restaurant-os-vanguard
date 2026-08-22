/**
 * MCC-E3 — Rotation automatique de session TTL 12h (super_admin MCC).
 *
 * OWASP A07:2021 (Identification Failures) :
 * Une session admin sans expiration est un risque majeur (session hijacking,
 * token volé sur poste laissé ouvert). Les sessions MCC super_admin doivent
 * expirer après 12h d'inactivité et être ré-authentifiées.
 *
 * Ce service :
 *  1. Enregistre chaque activité admin (heartbeat)
 *  2. Vérifie au moment d'une action sensible que la session n'est pas expirée
 *  3. Force la déconnexion (révocation Firebase custom claims) si expirée
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-E3.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const SESSION_TTL_MS = 12 * 3600_000;

export interface AdminSessionRecord {
  uid: string;
  lastActivityAt: number;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionCheckResult {
  valid: boolean;
  uid: string;
  lastActivityAt: number;
  expiredAt?: number;
  ttlRemainingMs?: number;
}

export class SessionTTLRotationService {
  private static sessionPath(uid: string): string {
    return `mcc/admin_sessions/${uid}`;
  }

  static async heartbeat(uid: string, ipAddress?: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const existing = await Nexus.adapter.get<AdminSessionRecord>(this.sessionPath(uid));
    await Nexus.adapter.set(this.sessionPath(uid), {
      uid,
      lastActivityAt: ts,
      createdAt: existing?.createdAt ?? ts,
      ipAddress,
      userAgent: existing?.userAgent,
    });
  }

  static async check(uid: string, now?: number): Promise<SessionCheckResult> {
    const ts = now ?? Date.now();
    const session = await Nexus.adapter.get<AdminSessionRecord>(this.sessionPath(uid));

    if (!session) {
      return { valid: false, uid, lastActivityAt: 0, expiredAt: 0 };
    }

    const elapsed = ts - session.lastActivityAt;
    if (elapsed > SESSION_TTL_MS) {
      const expiredAt = session.lastActivityAt + SESSION_TTL_MS;
      await this.revokeSession(uid, 'ttl_expired', ts);
      return { valid: false, uid, lastActivityAt: session.lastActivityAt, expiredAt };
    }

    return {
      valid: true,
      uid,
      lastActivityAt: session.lastActivityAt,
      ttlRemainingMs: SESSION_TTL_MS - elapsed,
    };
  }

  static async assertValid(uid: string, now?: number): Promise<SessionCheckResult> {
    const result = await this.check(uid, now);
    if (!result.valid) {
      throw new Error(`SESSION_EXPIRED:${uid}`);
    }
    return result;
  }

  static async revokeSession(uid: string, reason: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    await Nexus.adapter.set(this.sessionPath(uid), { uid, revokedAt: ts, reason });
    await Nexus.adapter.set(`mcc/claims_refresh/${uid}`, {
      uid,
      status: 'pending',
      action: 'revoke',
      reason,
      requestedAt: ts,
    });

    await AuditLogger.logAction(uid, 'SESSION_REVOKED', uid, { reason, revokedAt: ts }).catch(() => null);

    await NexusEventBus.emit('security.admin_session_revoked', {
      v: 1,
      uid,
      reason,
      revokedAt: ts,
    }).catch(() => null);
  }
}
