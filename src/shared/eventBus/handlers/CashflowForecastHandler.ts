import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface TicketZRecord {
  date: string;
  totalInMicrounits: number;
  ordersCount?: number;
}

export class CashflowForecastHandler {
  /**
   * Calcule la prévision de CA pour J+1 en utilisant une moyenne mobile 7 jours
   * pondérée par le jour de la semaine (day-of-week factor).
   */
  private static computeForecast(
    historicalData: TicketZRecord[],
    forecastDate: Date,
    fallbackAmount: number
  ): { predictedRevenueInMicrounits: number; method: string; dataPoints: number } {
    if (historicalData.length < 3) {
      // Pas assez de données : fallback +5%
      return {
        predictedRevenueInMicrounits: Math.round(fallbackAmount * 1.05),
        method: 'fallback_5pct',
        dataPoints: historicalData.length
      };
    }

    // Moyenne mobile 7 jours
    const movingAvg = historicalData.reduce((sum, d) => sum + d.totalInMicrounits, 0) / historicalData.length;

    // Day-of-week factor : pondérer davantage les jours identiques
    const targetDow = forecastDate.getDay(); // 0=dim, 1=lun, ...
    const sameDowEntries = historicalData.filter(d => new Date(d.date).getDay() === targetDow);

    if (sameDowEntries.length === 0) {
      // Pas de jour similaire dans l'historique, utiliser la moyenne simple
      return {
        predictedRevenueInMicrounits: Math.round(movingAvg),
        method: 'moving_avg_7d',
        dataPoints: historicalData.length
      };
    }

    // Moyenne des jours identiques (même jour de semaine)
    const dowAvg = sameDowEntries.reduce((sum, d) => sum + d.totalInMicrounits, 0) / sameDowEntries.length;

    // Pondération : 60% jour de semaine, 40% moyenne globale
    const weightedForecast = Math.round(dowAvg * 0.6 + movingAvg * 0.4);

    return {
      predictedRevenueInMicrounits: weightedForecast,
      method: 'weighted_dow_moving_avg',
      dataPoints: historicalData.length
    };
  }

  static register() {
    return NexusEventBus.on('finance.ticket_z_closed', async (payload) => {
      const { tenantId, date, totalInMicrounits, ordersCount } = payload;

      logger.info(`[CashflowForecast] Ticket Z fermé le ${date} pour ${totalInMicrounits}µ. Calcul prévision J+1...`);

      const forecastDate = new Date(new Date(date).getTime() + 86400000);
      const forecastDateStr = forecastDate.toISOString().split('T')[0];
      const forecastId = `forecast_${forecastDateStr}`;

      // Récupérer les 7 derniers jours de Ticket Z pour la moyenne mobile
      const sevenDaysAgo = new Date(new Date(date).getTime() - 7 * 86400000).toISOString().split('T')[0];

      let historicalData: TicketZRecord[] = [];
      try {
        historicalData = await Nexus.adapter.query<TicketZRecord>(
          `tenants/${tenantId}/finance/ticketZ`, {
            where: [
              { field: 'date', operator: '>=', value: sevenDaysAgo },
              { field: 'date', operator: '<=', value: date }
            ]
          }
        );
      } catch (err) {
        logger.warn(`[CashflowForecast] Impossible de récupérer l'historique Ticket Z, fallback +5%`, String(err));
      }

      const forecast = CashflowForecastHandler.computeForecast(
        historicalData,
        forecastDate,
        totalInMicrounits
      );

      // Ecriture de la prévision dans le ledger
      await Nexus.adapter.update(`tenants/${tenantId}/finance/forecasts/${forecastId}`, {
        date: forecastDateStr,
        predictedRevenueInMicrounits: forecast.predictedRevenueInMicrounits,
        method: forecast.method,
        dataPoints: forecast.dataPoints,
        basedOnTicketZDate: date,
        basedOnRevenue: totalInMicrounits,
        updatedAt: Date.now()
      });

      empireAudit.log({
        module: 'finance',
        action: 'CASHFLOW_FORECAST_GENERATED',
        userId: 'system',
        instanceId: tenantId,
        details: {
          date: forecastDateStr,
          forecastedAmount: forecast.predictedRevenueInMicrounits,
          method: forecast.method,
          dataPoints: forecast.dataPoints
        },
        severity: 'low',
        timestamp: new Date(),
      });
    }, { id: 'cashflow-forecast', priority: 'BACKGROUND' });
  }
}
