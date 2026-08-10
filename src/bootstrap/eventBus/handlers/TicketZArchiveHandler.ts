import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerTicketZArchiveHandler() {
  return NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload) => {
      const { tenantId, date } = payload;
      
      const ticketPath = `tenants/${tenantId}/ticketZ/${date}`;
      const ticketZ = await Nexus.adapter.get(ticketPath);
      
      if (!ticketZ) return;

      const archivePath = `tenants/${tenantId}/archives/ticketZ_${date}`;
      
      // On copie le Ticket Z dans une collection froide/sécurisée
      await Nexus.adapter.set(archivePath, {
        ...ticketZ,
        archivedAt: new Date().toISOString(),
      });
      
      logger.info(`[TicketZArchive] Ticket Z du ${date} archivé avec succès.`);
      
      empireAudit.log({
        module: 'accounting',
        action: 'TICKET_Z_ARCHIVED',
        details: { date, archivePath },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // On déclenche l'audit cryptographique quotidien de la chaîne NF525
      await NexusEventBus.emit('finance.daily_audit', {
        v: 1,
        tenantId,
        date,
      });
    },
    { id: 'ticket-z-archive-handler', priority: 'BACKGROUND' }
  );
}
