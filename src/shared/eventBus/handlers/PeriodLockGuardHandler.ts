import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class PeriodLockGuardHandler {
  /**
   * Vérifie si une période fiscale est verrouillée pour un tenant donné.
   * Utilisable par tout service avant d'autoriser une écriture comptable.
   * @param tenantId - ID du tenant
   * @param date - Date ISO (YYYY-MM-DD) dont on veut vérifier le mois
   * @returns true si la période (mois) est verrouillée (NF525)
   */
  static async isPeriodLocked(tenantId: string, date: string): Promise<boolean> {
    const periodId = date.substring(0, 7); // YYYY-MM
    try {
      const lock = await Nexus.adapter.get<{ isLocked?: boolean }>(
        `tenants/${tenantId}/fiscalLedger/locks/${periodId}`
      );
      return lock?.isLocked === true;
    } catch {
      // Si le document n'existe pas, la période n'est pas verrouillée
      return false;
    }
  }

  static register() {
    return NexusEventBus.on('finance.period_locked', async (payload) => {
      const { tenantId, periodId, lockedBy, lockedAt } = payload;

      logger.info(`[PeriodLockGuard] Période fiscale ${periodId} verrouillée par ${lockedBy}.`);

      // On inscrit le lock en base (Souveraineté NF525)
      await Nexus.adapter.update(`tenants/${tenantId}/fiscalLedger/locks/${periodId}`, {
        isLocked: true,
        lockedBy,
        lockedAt,
        lockReason: 'MONTHLY_CLOSING_NF525'
      });

      empireAudit.log({
        module: 'finance',
        action: 'FISCAL_PERIOD_LOCKED',
        userId: lockedBy,
        instanceId: tenantId,
        details: { periodId, lockedAt },
        severity: 'critical',
       timestamp: new Date(),
});

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-lock-${periodId}`,
        type: 'warning',
        title: 'Période Clôturée',
        message: `La période ${periodId} a été clôturée. Toute modification comptable est désormais bloquée (NF525).`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
