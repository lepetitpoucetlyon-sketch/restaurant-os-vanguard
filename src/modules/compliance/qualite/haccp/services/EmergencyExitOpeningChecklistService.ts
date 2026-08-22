import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface EmergencyExitCheckRequest {
  tenantId: string;
  adminId: string;
  exitId: string;
  exitLocation: string;
  isUnlockedAndClear: boolean;
  photoProofUrl?: string;
}

export interface EmergencyExitCheckResult {
  exitId: string;
  verified: boolean;
  canOpenPOS: boolean;
  blockReason?: string;
  verifiedAt: number;
}

/**
 * EmergencyExitOpeningChecklistService — Angle mort L65.
 * Checklist d'ouverture ERP : Vérification et preuve visuelle de déverrouillage et dégagement des issues de secours avant d'autoriser l'ouverture caisse.
 */
export class EmergencyExitOpeningChecklistService {
  static async verifyEmergencyExit(
    req: EmergencyExitCheckRequest
  ): Promise<EmergencyExitCheckResult> {
    if (!req.isUnlockedAndClear) {
      return {
        exitId: req.exitId,
        verified: false,
        canOpenPOS: false,
        blockReason: `L'issue de secours ${req.exitLocation} (${req.exitId}) n'est pas déverrouillée ou est encombrée. Ouverture caisse bloquée.`,
        verifiedAt: Date.now(),
      };
    }

    NexusEventBus.emit('compliance.emergency_exit_verified', {
      v: 1,
      tenantId: req.tenantId,
      exitId: req.exitId,
      photoVerificationUrl: req.photoProofUrl || 'NONE',
      verifiedBy: req.adminId,
      verifiedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: req.adminId,
      action: 'EMERGENCY_EXIT_CHECK_RECORDED',
      targetId: req.exitId,
      ipAddress: '127.0.0.1',
      metadata: {
        exitLocation: req.exitLocation,
        photoProofUrl: req.photoProofUrl,
      },
    });

    return {
      exitId: req.exitId,
      verified: true,
      canOpenPOS: true,
      verifiedAt: Date.now(),
    };
  }
}
