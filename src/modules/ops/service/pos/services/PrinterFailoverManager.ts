import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface PrinterDevice {
  id: string;
  name: string;
  ipAddress: string;
  isOnline: boolean;
  hasPaper: boolean;
  isBackupPrinter?: boolean;
}

/**
 * 🖨️ PrinterFailoverManager (Item 2.2)
 * Gestionnaire de secours d'imprimantes de caisse & cuisine.
 * Détecte les erreurs réseau/papier et redirige le job d'impression vers l'imprimante secours valide la plus proche.
 */
export class PrinterFailoverManager {
  static resolveFallbackPrinter(
    targetPrinterId: string,
    availablePrinters: PrinterDevice[]
  ): PrinterDevice | null {
    const target = availablePrinters.find(p => p.id === targetPrinterId);

    if (target && target.isOnline && target.hasPaper) {
      return target; // Imprimante principale OK
    }

    logger.warn(`[PrinterFailoverManager] Imprimante ${targetPrinterId} indisponible (Online: ${target?.isOnline}, Paper: ${target?.hasPaper}). Recherche de secours...`);

    // Trouver la première imprimante secours disponible
    const fallback = availablePrinters.find(p => p.id !== targetPrinterId && p.isOnline && p.hasPaper);

    if (fallback) {
      logger.info(`[PrinterFailoverManager] Imprimante secours retenue : ${fallback.name} (${fallback.id})`);
      empireAudit.log({
        module: 'ops',
        action: 'PRINTER_FAILOVER_TRIGGERED',
        details: { targetPrinterId, fallbackPrinterId: fallback.id, fallbackName: fallback.name },
        severity: 'medium',
        timestamp: new Date(),
      });
      return fallback;
    }

    logger.error(`[PrinterFailoverManager] Aucune imprimante de secours disponible !`);
    return null;
  }
}
