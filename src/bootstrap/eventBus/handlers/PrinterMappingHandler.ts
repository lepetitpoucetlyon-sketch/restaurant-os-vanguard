/**
 * PrinterMappingHandler — Hardware 1.2 : mapping imprimante → station
 *
 * Quand une imprimante est associée à une station (`hardware.printer_mapped`),
 * met à jour la configuration de routage KDS/POS dans Nexus pour que
 * les tickets soient envoyés à la bonne imprimante.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerPrinterMappingHandler(): () => void {
  return NexusEventBus.on(
    'hardware.printer_mapped',
    async (payload) => {
      const { tenantId, printerId, stationId, name, printerType, mappedAt } = payload;

      try {
        // 1. Mettre à jour la config d'imprimante dans Nexus
        const printerPath = `tenants/${tenantId}/printerMappings/${printerId}`;
        await Nexus.adapter.set(printerPath, {
          printerId,
          stationId,
          name,
          printerType,
          mappedAt,
          active: true,
        });

        // 2. Mettre à jour la station associée (référence croisée)
        const stationPath = `tenants/${tenantId}/kdsStations/${stationId}`;
        await Nexus.adapter.update(stationPath, {
          printerId,
          printerName: name,
          printerType,
          updatedAt: mappedAt,
        }).catch(() => {
          // Station non encore créée — OK, le mapping est persisté côté imprimante
          logger.info(`[PrinterMapping] Station ${stationId} non trouvée — mapping persisté côté printer.`);
        });

        logger.info(
          `[PrinterMapping] Imprimante ${name} (${printerId}) → station ${stationId} [${printerType}]`
        );

        empireAudit.log({
          module: 'ops',
          action: 'PRINTER_MAPPED',
          details: { printerId, stationId, name, printerType },
          severity: 'low',
          timestamp: new Date(mappedAt),
        });
      } catch (err) {
        logger.error('[PrinterMapping] Erreur mapping imprimante', err);
        throw err;
      }
    },
    { id: 'printer-mapping', priority: 'HIGH' }
  );
}
