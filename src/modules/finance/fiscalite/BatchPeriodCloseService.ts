import { closeTicketZForDay } from '@/shared/eventBus/handlers/TicketZHandler';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface BatchCloseResult {
  fromDay: string;
  toDay: string;
  closedDays: string[];
  skippedDays: string[];
  totalInMicrounits: number;
  totalOrdersCount: number;
}

export class BatchPeriodCloseService {
  /**
   * Génère la liste ordonnée chronologique de tous les jours (YYYY-MM-DD) entre fromDay et toDay inclus.
   */
  public static enumerateDays(fromDay: string, toDay: string): string[] {
    const days: string[] = [];
    const current = new Date(`${fromDay}T00:00:00.000Z`);
    const end = new Date(`${toDay}T00:00:00.000Z`);

    if (isNaN(current.getTime()) || isNaN(end.getTime())) {
      throw new Error(`[BatchPeriodCloseService] Dates invalides : from=${fromDay}, to=${toDay}`);
    }

    if (current.getTime() > end.getTime()) {
      throw new Error(`[BatchPeriodCloseService] fromDay (${fromDay}) ne peut pas être postérieur à toDay (${toDay})`);
    }

    while (current.getTime() <= end.getTime()) {
      days.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
  }

  /**
   * Clôture en rafale (batch) une plage de journées de service (Lot 4 - M4).
   * Idempotent : saute les jours déjà clôturés et scelle les jours manquants (y compris jours blancs).
   */
  public static async closePeriodRange(params: {
    tenantId: string;
    fromDay: string;
    toDay: string;
    operatorId: string;
    allowBlankDays?: boolean;
  }): Promise<BatchCloseResult> {
    const { tenantId, fromDay, toDay, operatorId, allowBlankDays = true } = params;
    const days = this.enumerateDays(fromDay, toDay);

    const closedDays: string[] = [];
    const skippedDays: string[] = [];
    let totalInMicrounits = 0;
    let totalOrdersCount = 0;

    logger.info(
      `[BatchPeriodCloseService] Début de clôture en rafale pour tenant=${tenantId} : ${days.length} jour(s) de ${fromDay} à ${toDay}`
    );

    // Clôture séquentielle stricte pour préserver le chaînage fiscal NF525
    for (const day of days) {
      const result = await closeTicketZForDay(tenantId, day, {
        allowBlankDay: allowBlankDays,
        operatorId,
      });

      if (result.closed) {
        closedDays.push(day);
        totalInMicrounits += result.totalInMicrounits;
        totalOrdersCount += result.ordersCount;
      } else {
        skippedDays.push(day);
      }
    }

    empireAudit.log({
      module: 'accounting',
      action: 'BATCH_PERIOD_CLOSED',
      details: {
        fromDay,
        toDay,
        closedDaysCount: closedDays.length,
        skippedDaysCount: skippedDays.length,
        totalInMicrounits,
        totalOrdersCount,
        operatorId,
      },
      severity: 'medium',
      timestamp: new Date(),
    });

    await NexusEventBus.emitDurable('finance.period_closed_batch', {
      v: 1,
      tenantId,
      fromDay,
      toDay,
      closedDays,
      skippedDays,
      totalInMicrounits,
      totalOrdersCount,
      operatorId,
    });

    logger.info(
      `[BatchPeriodCloseService] Fin de clôture en rafale : ${closedDays.length} jour(s) scellés, ${skippedDays.length} ignorés, CA total=${(totalInMicrounits / 1_000_000).toFixed(2)}€`
    );

    return {
      fromDay,
      toDay,
      closedDays,
      skippedDays,
      totalInMicrounits,
      totalOrdersCount,
    };
  }
}
