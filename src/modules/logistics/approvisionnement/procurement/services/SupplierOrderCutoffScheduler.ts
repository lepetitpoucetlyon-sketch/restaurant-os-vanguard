import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface SupplierCutoffConfig {
  supplierId: string;
  supplierName: string;
  cutoffTime: string; // '23:00'
  deliveryDays: string[]; // ['monday', 'wednesday', 'friday']
  draftOrderTotalInMicrounits: number;
}

export interface CutoffStatusResult {
  supplierId: string;
  isUrgentCutoffApproaching: boolean;
  minutesRemaining: number;
  alertBanner?: string;
}

/**
 * SupplierOrderCutoffScheduler — Angle mort T55 (DF-J1).
 * Surveillance des heures limites (cut-off) de commande par fournisseur (ex: Pomona 23h00, Metro 22h30).
 */
export class SupplierOrderCutoffScheduler {
  static evaluateCutoff(
    tenantId: string,
    config: SupplierCutoffConfig,
    now: Date = new Date()
  ): CutoffStatusResult {
    const [hours, minutes] = config.cutoffTime.split(':').map(Number);
    const cutoffDate = new Date(now);
    cutoffDate.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.floor((cutoffDate.getTime() - now.getTime()) / (60 * 1000));
    const warningWindowMin = getSetting<number>('inventory', 'supplier_cutoff_warning_min', 60);
    const isUrgentCutoffApproaching = diffMinutes > 0 && diffMinutes <= warningWindowMin;

    if (isUrgentCutoffApproaching) {
      NexusEventBus.emit('stock.cutoff_alert_triggered', {
        v: 1,
        tenantId,
        supplierId: config.supplierId,
        cutoffTimeIso: cutoffDate.toISOString(),
        minutesRemaining: diffMinutes,
        draftOrderValueInMicrounits: config.draftOrderTotalInMicrounits,
        alertedAt: Date.now(),
      });
    }

    return {
      supplierId: config.supplierId,
      isUrgentCutoffApproaching,
      minutesRemaining: Math.max(0, diffMinutes),
      alertBanner: isUrgentCutoffApproaching
        ? `⏰ CUT-OFF ${config.supplierName} dans ${diffMinutes} min : Valider le panier de ${Math.round(config.draftOrderTotalInMicrounits / 1_000_000)} € avant clôture.`
        : undefined,
    };
  }
}
