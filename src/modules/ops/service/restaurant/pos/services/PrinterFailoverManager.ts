import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface PrinterDevice {
  id: string;
  name: string;
  ipAddress: string;
  isOnline: boolean;
  hasPaper: boolean;
  group?: 'kitchen' | 'bar' | 'receipt' | 'counter';
  isBackupPrinter?: boolean;
}

/**
 * 🖨️ PrinterFailoverManager (Item 2.2 — DF-D1)
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

    const failoverGroupOnly = getSetting<boolean>('pos', 'failover_group_only', false);

    logger.warn(`[PrinterFailoverManager] Imprimante ${targetPrinterId} indisponible (Online: ${target?.isOnline}, Paper: ${target?.hasPaper}, failoverGroupOnly: ${failoverGroupOnly}). Recherche de secours...`);

    // Trouver la première imprimante secours disponible (filtrée par groupe si configuré)
    const fallback = availablePrinters.find(p => {
      if (p.id === targetPrinterId || !p.isOnline || !p.hasPaper) return false;
      if (failoverGroupOnly && target?.group && p.group && p.group !== target.group) return false;
      return true;
    });

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
