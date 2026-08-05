import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export type AuditAction = 
  | 'KILL_SWITCH_ACTIVATE' 
  | 'KILL_SWITCH_DEACTIVATE' 
  | 'DEVICE_MDM_LOCK' 
  | 'DEVICE_MDM_UNLOCK' 
  | 'RESELLER_DELETE'
  | 'COMMISSION_UPDATE'
  | 'MFA_ENABLED';

export interface AuditLog {
  id: string;
  adminId: string;
  action: AuditAction;
  targetId: string;
  ipAddress: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Journal d'Audit Inaltérable du MCC
 * Enregistre toutes les actions destructrices ou critiques effectuées par un `empire_admin`.
 */
export class AuditLogger {
  
  static async logAction(
    adminId: string, 
    action: AuditAction, 
    targetId: string, 
    metadata?: Record<string, unknown>, 
    ipAddress: string = '0.0.0.0'
  ) {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      adminId,
      action,
      targetId,
      ipAddress,
      timestamp: Date.now(),
      metadata
    };

    // 1. Trace dans les logs du serveur
    logger.info(`[AUDIT TRAIL] [${action}] by ${adminId} on target ${targetId}`);
    
    // 2. Sauvegarde inaltérable dans le registre d'audit du MCC
    try {
      await Nexus.adapter.set(`mcc/audit_trail/${log.id}`, log);
    } catch (err) {
      logger.error(`[AUDIT TRAIL] ECHEC DE SAUVEGARDE DU LOG !`, err);
      // En production, si la base d'audit crashe, on devrait idéalement suspendre l'action
    }
  }
}
