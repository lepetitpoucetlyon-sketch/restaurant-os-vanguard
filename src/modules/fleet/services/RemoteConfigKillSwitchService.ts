import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface KillSwitchRequest {
  tenantId: string;
  adminId: string;
  featureFlag: string; // ex: 'enable_ai_sommelier', 'enable_stripe_terminal', 'allow_offline_standin'
  enable: boolean;
  reason: string;
}

export interface RemoteConfigState {
  tenantId: string;
  featureFlag: string;
  isEnabled: boolean;
  appliedAt: number;
}

/**
 * RemoteConfigKillSwitchService — Angle mort MCC-B2.
 * Remote Configuration & Kill-Switch instantané par feature flag :
 * Permet de désactiver à chaud un module défaillant sur un restaurant ou sur toute la flotte sans redéployer.
 */
export class RemoteConfigKillSwitchService {
  static async toggleFeature(req: KillSwitchRequest): Promise<RemoteConfigState> {
    NexusEventBus.emit('fleet.kill_switch_toggled', {
      v: 1,
      tenantId: req.tenantId,
      featureFlag: req.featureFlag,
      isEnabled: req.enable,
      toggledBy: req.adminId,
      toggledAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: req.adminId,
      action: 'REMOTE_KILL_SWITCH_ENGAGED',
      targetId: `${req.tenantId}:${req.featureFlag}`,
      ipAddress: '127.0.0.1',
      metadata: {
        featureFlag: req.featureFlag,
        isEnabled: req.enable,
        reason: req.reason,
      },
    });

    return {
      tenantId: req.tenantId,
      featureFlag: req.featureFlag,
      isEnabled: req.enable,
      appliedAt: Date.now(),
    };
  }
}
