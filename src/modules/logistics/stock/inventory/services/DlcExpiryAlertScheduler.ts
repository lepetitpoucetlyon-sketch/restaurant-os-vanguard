import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface StockItemWithDLC {
  batchId: string;
  sku: string;
  name: string;
  expiryDateIso: string; // YYYY-MM-DD
  quantityInStock: number;
  unit: string;
  costInMicrounits: number;
}

export interface DlcAlertStatus {
  batchId: string;
  sku: string;
  name: string;
  daysRemaining: number;
  alertSeverity: 'nominal' | 'j_minus_3' | 'j_minus_1' | 'expired';
  recommendedAction: string;
}

/**
 * DlcExpiryAlertScheduler — Angle mort H4.
 * Surveillance des Dates Limites de Consommation (DLC) avec alertes cadencées J-3 / J-1 / J-0 et suggestions de transformation en plat du jour pour zéro gaspillage.
 */
export class DlcExpiryAlertScheduler {
  static evaluateBatchDLC(tenantId: string, item: StockItemWithDLC): DlcAlertStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(item.expiryDateIso);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 3600 * 24));

    let alertSeverity: DlcAlertStatus['alertSeverity'] = 'nominal';
    let recommendedAction = 'Stock conforme.';

    if (daysRemaining < 0) {
      alertSeverity = 'expired';
      recommendedAction = '🚨 DLC DÉPASSÉE : Destruction sanitaire et inscription au registre des pertes obligatoire.';
    } else if (daysRemaining <= 1) {
      alertSeverity = 'j_minus_1';
      recommendedAction = '⚠️ DLC J-1 : Cuisiner impérativement ce jour en suggestion du chef ou plat du jour.';
    } else if (daysRemaining <= 3) {
      alertSeverity = 'j_minus_3';
      recommendedAction = 'DLC J-3 : Planifier la mise en place sur les prochains services.';
    }

    if (alertSeverity !== 'nominal') {
      NexusEventBus.emit('stock.dlc_alert_triggered', {
        v: 1,
        tenantId,
        batchId: item.batchId,
        sku: item.sku,
        daysRemaining,
        severity: alertSeverity,
        alertedAt: Date.now(),
      });
    }

    return {
      batchId: item.batchId,
      sku: item.sku,
      name: item.name,
      daysRemaining,
      alertSeverity,
      recommendedAction,
    };
  }
}
