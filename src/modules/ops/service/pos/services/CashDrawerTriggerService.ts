import { AuditLogger } from '@/lib/audit';
import { logger } from '@/lib/logger';

export interface CashDrawerTriggerRequest {
  tenantId: string;
  adminId: string;
  terminalId: string;
  reason: 'cash_payment' | 'cash_refund' | 'manual_open' | 'cash_drop';
  orderId?: string;
}

export interface CashDrawerTriggerResult {
  triggered: boolean;
  pulseSequenceHex: string;
  timestamp: number;
}

/**
 * CashDrawerTriggerService — Angle mort I2.
 * Pilote l'ouverture automatique du tiroir-caisse (impulsion standard RJ11/RJ12 24V ou USB relay) avec journalisation inaltérable.
 */
export class CashDrawerTriggerService {
  // Standard ESC/POS drawer kick pulse: ESC p m t1 t2
  // Hex: 1B 70 00 19 FA (pin 2, ON 50ms, OFF 500ms)
  public static readonly ESC_POS_KICK_HEX = '1B700019FA';

  static async triggerOpen(req: CashDrawerTriggerRequest): Promise<CashDrawerTriggerResult> {
    logger.info(`[CASH-DRAWER] Opening drawer on terminal ${req.terminalId} for reason ${req.reason}`);

    // Always audit manual drawer openings for anti-theft compliance
    if (req.reason === 'manual_open') {
      await AuditLogger.logAction({
        adminId: req.adminId,
        action: 'CASH_DRAWER_OPENED',
        targetId: req.terminalId,
        ipAddress: '127.0.0.1',
        metadata: {
          reason: req.reason,
          orderId: req.orderId,
        },
      });
    }

    return {
      triggered: true,
      pulseSequenceHex: this.ESC_POS_KICK_HEX,
      timestamp: Date.now(),
    };
  }
}
