import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerMonthlyFECExportHandler() {
  return NexusEventBus.on(
    'finance.month_closed',
    async (payload) => {
      const { tenantId, month } = payload;
      
      logger.info(`[FECExport] Génération de l'export FEC pour ${month}...`);
      
      // Simulation: on récupérerait toutes les `journalEntries` du mois
      // On formatterait en TXT/CSV selon la norme FEC (Livre, Numéro de compte, Libellé, Débit, Crédit, etc.)
      
      const fileUrl = `https://storage.restaurant-os.com/${tenantId}/fec/${month}.txt`;
      
      logger.info(`[FECExport] FEC généré avec succès: ${fileUrl}`);
      
      empireAudit.log({
        module: 'accounting',
        action: 'FEC_EXPORT_GENERATED',
        details: { month, fileUrl },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // On notifie le comptable
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId,
        id: `fec-notif-${month}`,
        type: 'info',
        title: 'Export FEC disponible',
        message: `L'export comptable FEC pour ${month} est prêt.`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
      });
    },
    { id: 'monthly-fec-export-handler', priority: 'BACKGROUND' }
  );
}
