import { logger } from '@/lib/logger';

export interface ServerShiftSalesInput {
  serverId: string;
  shiftId: string;
  hoursWorked: number;
  totalSalesInMicrounits: number;
  coversServed: number;
  dessertSalesCount: number;
  coffeeSalesCount: number;
}

export interface ServerProductivityMetrics {
  serverId: string;
  shiftId: string;
  salesPerHourInMicrounits: number;
  averageCheckPerCoverInMicrounits: number;
  upsellingRatio: number; // % of covers taking dessert/coffee
}

/**
 * 📊 ServerProductivityEngine (Item 8.1)
 * Moteur de mesure de la productivité par serveur / rang (Sales per Server Hour).
 * Calcule le CA par heure travaillée, le ticket moyen par convive et le taux de vente additionnelle (desserts/cafés).
 */
export class ServerProductivityEngine {
  static computeProductivity(input: ServerShiftSalesInput): ServerProductivityMetrics {
    const hours = Math.max(0.5, input.hoursWorked);
    const salesPerHour = Math.round(input.totalSalesInMicrounits / hours);
    const averageCheck = input.coversServed > 0
      ? Math.round(input.totalSalesInMicrounits / input.coversServed)
      : 0;

    const upsellingRatio = input.coversServed > 0
      ? Math.round(((input.dessertSalesCount + input.coffeeSalesCount) / input.coversServed) * 100)
      : 0;

    logger.info(`[ServerProductivityEngine] Serveur ${input.serverId} -> CA/h: ${(salesPerHour / 1_000_000).toFixed(2)}€, Ticket: ${(averageCheck / 1_000_000).toFixed(2)}€, Upsell: ${upsellingRatio}%`);

    return {
      serverId: input.serverId,
      shiftId: input.shiftId,
      salesPerHourInMicrounits: salesPerHour,
      averageCheckPerCoverInMicrounits: averageCheck,
      upsellingRatio,
    };
  }
}
