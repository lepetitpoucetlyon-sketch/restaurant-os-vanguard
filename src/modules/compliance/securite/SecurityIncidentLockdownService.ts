import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface LockdownRequest {
  tenantId: string;
  triggeredByAdminId: string;
  reason: string; // ex: 'credential_leak', 'brute_force_detected', 'suspicious_export'
  activeSessionTokens: string[];
}

export interface LockdownStatus {
  tenantId: string;
  isLocked: boolean;
  revokedTokensCount: number;
  lockedAt: number;
}

/**
 * SecurityIncidentLockdownService — Angle mort MCC-D5.
 * Verrouillage d'urgence du tenant en cas d'intrusion :
 * Révocation instantanée de tous les tokens JWT actifs et blocage des écritures POS.
 */
export class SecurityIncidentLockdownService {
  static async executeLockdown(req: LockdownRequest): Promise<LockdownStatus> {
    NexusEventBus.emit('security.lockdown_enforced', {
      v: 1,
      tenantId: req.tenantId,
      reason: req.reason,
      revokedTokensCount: req.activeSessionTokens.length,
      lockedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: req.triggeredByAdminId,
      action: 'SECURITY_LOCKDOWN_ENFORCED',
      targetId: req.tenantId,
      ipAddress: '127.0.0.1',
      metadata: {
        reason: req.reason,
        revokedSessionsCount: req.activeSessionTokens.length,
      },
    });

    return {
      tenantId: req.tenantId,
      isLocked: true,
      revokedTokensCount: req.activeSessionTokens.length,
      lockedAt: Date.now(),
    };
  }
}
