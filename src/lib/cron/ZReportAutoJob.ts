import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * ZReportAutoJob (P0-2.2)
 * Se déclenche quotidiennement à 23h59.
 * Pour chaque tenant actif, vérifie si le Z de la journée a été clôturé.
 * Sinon, déclenche la clôture automatique `finance.z_report_requested`.
 */
export const ZReportAutoJob = {
  name: 'ZReportAutoJob',
  schedule: '59 23 * * *', // 23h59 chaque jour
  async runForTenant(tenantId: string): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const zReportPath = `tenants/${tenantId}/zReports/${todayStr}`;

    try {
      const existingZ = await Nexus.adapter.get<Record<string, unknown>>(zReportPath);
      if (existingZ && existingZ.status === 'closed') {
        logger.info(`[ZReportAutoJob] Clôture Z du ${todayStr} déjà effectuée manuellement pour tenant ${tenantId}. Skip.`);
        return;
      }

      logger.warn(`[ZReportAutoJob] Clôture Z automatique de fin de journée pour tenant ${tenantId} (${todayStr})`);
      await NexusEventBus.emitDurable('finance.z_report_requested', {
        tenantId,
        operatorId: 'SYSTEM_CRON_AUTO',
        requestedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(`[ZReportAutoJob] Échec de la clôture Z automatique pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
