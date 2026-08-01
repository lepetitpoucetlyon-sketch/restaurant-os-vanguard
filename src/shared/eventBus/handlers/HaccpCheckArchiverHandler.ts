import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerHaccpCheckArchiverHandler(): () => void {
  return NexusEventBus.on(
    'haccp.check.saved',
    async (payload) => {
      const { checkId, tenantId } = payload;
      logger.info(`[HaccpCheckArchiver] Archivage du relevé HACCP ${checkId}`);

      const checkData = await Nexus.adapter.get(`tenants/${tenantId}/haccpChecks/${checkId}`) as Record<string, unknown> | null;

      if (!checkData) {
        logger.warn(`[HaccpCheckArchiver] Relevé ${checkId} introuvable — archivage ignoré.`);
        return;
      }

      await Nexus.adapter.set(`tenants/${tenantId}/haccpArchives/${checkId}`, {
        ...checkData,
        archivedAt: new Date().toISOString(),
        source: 'auto-archiver',
      });

      empireAudit.log({
        module: 'compliance',
        action: 'HACCP_CHECK_ARCHIVED',
        details: { checkId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'haccp-check-archiver-handler', priority: 'BACKGROUND' }
  );
}
