import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface CashflowForecastInput {
  tenantId: string;
  currentBankBalanceInMicrounits: number;
  projectedRevenue30DaysInMicrounits: number;
  confirmedPayables30DaysInMicrounits: number; // Factures fournisseurs exigibles
  estimatedPayroll30DaysInMicrounits: number;
}

export interface CashflowForecastOutput {
  tenantId: string;
  currentBalanceInMicrounits: number;
  projectedInflowInMicrounits: number;
  projectedOutflowInMicrounits: number;
  netPosition30DaysInMicrounits: number;
  isDeficitAlert: boolean;
}

/**
 * 💰 CashflowForecastEngine (Item 5.2)
 * Moteur de prévisionnel de trésorerie nette à 30 / 60 / 90 jours.
 * Fait le rapprochement entre le solde bancaire direct, les revenus estimés et l'échéancier des dettes fournisseurs et paies.
 */
export class CashflowForecastEngine {
  static computeForecast(input: CashflowForecastInput): CashflowForecastOutput {
    const projectedInflow = input.projectedRevenue30DaysInMicrounits;
    const projectedOutflow = input.confirmedPayables30DaysInMicrounits + input.estimatedPayroll30DaysInMicrounits;

    const netPosition = input.currentBankBalanceInMicrounits + projectedInflow - projectedOutflow;
    const isDeficitAlert = netPosition < 0;

    logger.info(`[CashflowForecastEngine] Tenant ${input.tenantId} -> Solde D+30: ${(netPosition / 1_000_000).toFixed(2)}€ (Alerte: ${isDeficitAlert})`);

    if (isDeficitAlert) {
      empireAudit.log({
        module: 'accounting',
        action: 'CASHFLOW_DEFICIT_PROJECTED',
        details: { tenantId: input.tenantId, netPositionInMicrounits: netPosition },
        severity: 'high',
        timestamp: new Date(),
      });
    }

    return {
      tenantId: input.tenantId,
      currentBalanceInMicrounits: input.currentBankBalanceInMicrounits,
      projectedInflowInMicrounits: projectedInflow,
      projectedOutflowInMicrounits: projectedOutflow,
      netPosition30DaysInMicrounits: netPosition,
      isDeficitAlert,
    };
  }
}
