import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class CashflowForecastHandler {
  static register() {
    return NexusEventBus.on('finance.ticket_z_closed', async (payload) => {
      const { tenantId, date, totalInMicrounits, ordersCount } = payload;
      
      logger.info(`[CashflowForecast] Ticket Z fermé le ${date} pour ${totalInMicrounits}µ. Calcul prévision J+1...`);
      
      // Calcul simpliste : On prévoit +5% pour le lendemain
      const forecastedAmount = Math.round(totalInMicrounits * 1.05);
      const forecastDate = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];
      const forecastId = `forecast_${forecastDate}`;

      // Écriture réelle dans le ledger
      await Nexus.adapter.update(`tenants/${tenantId}/finance/forecasts/${forecastId}`, {
        date: forecastDate,
        predictedRevenueInMicrounits: forecastedAmount,
        basedOnTicketZDate: date,
        basedOnRevenue: totalInMicrounits,
        updatedAt: Date.now()
      });

      empireAudit.log({
        module: 'finance',
        action: 'CASHFLOW_FORECAST_GENERATED',
        userId: 'system',
        instanceId: tenantId,
        details: { date: forecastDate, forecastedAmount },
        severity: 'low',
        timestamp: new Date(),
      });
    }, { id: 'cashflow-forecast', priority: 'BACKGROUND' });
  }
}
