import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface PrinterRoutingMap {
  primaryPrinterId: string;
  backupPrinterId: string;
  station: string; // 'cuisine_chaude' | 'bar' | 'passe_plat'
}

export interface PrinterStatusReport {
  printerId: string;
  isOnline: boolean;
  paperRemaining: 'ok' | 'low' | 'empty';
  errorCount: number;
}

export interface FailoverRouteDecision {
  targetPrinterId: string;
  isFailoverActive: boolean;
  alertBannerText?: string;
}

/**
 * PrinterFailoverRoutingService — Angle mort L41.
 * Bascule automatiquement l'impression des tickets cuisine/bar vers l'imprimante passe-plat en cas de panne ou rupture de papier.
 */
export class PrinterFailoverRoutingService {
  static resolvePrinter(
    tenantId: string,
    routingMap: PrinterRoutingMap,
    status: PrinterStatusReport
  ): FailoverRouteDecision {
    const isFailed = !status.isOnline || status.paperRemaining === 'empty' || status.errorCount >= 3;

    if (isFailed) {
      const reason = status.paperRemaining === 'empty' ? 'paper_out' : !status.isOnline ? 'offline' : 'timeout';

      NexusEventBus.emit('pos.printer_failover', {
        v: 1,
        tenantId,
        failedPrinterId: routingMap.primaryPrinterId,
        targetPrinterId: routingMap.backupPrinterId,
        station: routingMap.station,
        reason,
        failedAt: Date.now(),
      });

      AuditLogger.logAction({
        adminId: 'SYSTEM_HARDWARE',
        action: 'PRINTER_FAILOVER_TRIGGERED',
        targetId: routingMap.primaryPrinterId,
        ipAddress: '127.0.0.1',
        metadata: {
          backupPrinterId: routingMap.backupPrinterId,
          station: routingMap.station,
          reason,
        },
      });

      return {
        targetPrinterId: routingMap.backupPrinterId,
        isFailoverActive: true,
        alertBannerText: `⚠️ Imprimante ${routingMap.station} en panne (${reason}) : Impression redirigée vers ${routingMap.backupPrinterId}`,
      };
    }

    return {
      targetPrinterId: routingMap.primaryPrinterId,
      isFailoverActive: false,
    };
  }
}
