/**
 * MCC-E2 — MFA enforcement pour mcc_super_admin (côté serveur).
 *
 * L'existant : `MFAGate.tsx` bloque le rendu UI si aucun facteur TOTP n'est enrôlé.
 * Ce qui manque (angle mort MCC-E2) : les routes API critiques doivent AUSSI
 * refuser un caller sans MFA — sinon un attaquant contourne la gate en tapant
 * directement l'endpoint depuis curl.
 *
 * Ce service :
 *  1. `assertMfaOrDeny(callerUid, callerRole)` — lit l'état MFA depuis Nexus
 *     (source de vérité miroir des multiFactor Firebase) et refuse si le rôle
 *     mcc_* et pas d'enrollment
 *  2. `recordMfaEnrollment` — trace un enrollment TOTP réussi via AuditLogger
 *     `MFA_ENABLED` (hash chain SHA-256, opposable en audit forensique)
 *  3. `recordMfaDisablement` — inverse, log `MFA_DISABLED`
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-E2 (débloqué par ADR-014).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';

export interface MfaEnrollmentState {
  uid: string;
  role: string;
  hasTotp: boolean;
  enrolledAt?: number;
  lastRotatedAt?: number;
}

const MFA_STATE_PATH_PREFIX = 'mcc/mfa_state';
const MFA_REQUIRED_ROLES = new Set(['mcc_super_admin', 'super_admin']);

export class MFAEnforcementService {
  /**
   * Vérifie l'état MFA du caller. Renvoie `{ ok: true }` si autorisé,
   * `{ ok: false, reason }` sinon.
   */
  static async assertMfaOrDeny(callerUid: string, callerRole: string): Promise<
    { ok: true } | { ok: false; reason: 'MFA_REQUIRED' | 'STATE_UNKNOWN' }
  > {
    if (!MFA_REQUIRED_ROLES.has(callerRole)) return { ok: true };

    try {
      const state = await Nexus.adapter.get<MfaEnrollmentState>(`${MFA_STATE_PATH_PREFIX}/${callerUid}`);
      if (!state) return { ok: false, reason: 'STATE_UNKNOWN' };
      return state.hasTotp ? { ok: true } : { ok: false, reason: 'MFA_REQUIRED' };
    } catch {
      return { ok: false, reason: 'STATE_UNKNOWN' };
    }
  }

  static async recordMfaEnrollment(uid: string, role: string, ipAddress?: string): Promise<void> {
    const state: MfaEnrollmentState = {
      uid,
      role,
      hasTotp: true,
      enrolledAt: Date.now(),
      lastRotatedAt: Date.now(),
    };
    await Nexus.adapter.set(`${MFA_STATE_PATH_PREFIX}/${uid}`, state);
    await AuditLogger.logAction(uid, 'MFA_ENABLED', uid, { role }, ipAddress).catch(() => null);
  }

  static async recordMfaDisablement(uid: string, actorUid: string, ipAddress?: string): Promise<void> {
    const existing = await Nexus.adapter.get<MfaEnrollmentState>(`${MFA_STATE_PATH_PREFIX}/${uid}`);
    if (existing) {
      const next: MfaEnrollmentState = { ...existing, hasTotp: false };
      await Nexus.adapter.set(`${MFA_STATE_PATH_PREFIX}/${uid}`, next);
    }
    await AuditLogger.logAction(actorUid, 'MFA_DISABLED', uid, {}, ipAddress).catch(() => null);
  }
}
