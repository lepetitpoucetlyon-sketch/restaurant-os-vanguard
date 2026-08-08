import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface OverdueInvoiceItem {
  invoiceId: string;
  customerId: string;
  amountDueInMicrounits: number;
  dueDateIso: string;
  daysOverdue: number;
}

export interface DunningActionResult {
  invoiceId: string;
  step: 'REMINDER_SOFT' | 'REMINDER_FIRM' | 'FORMAL_NOTICE_CONTENTIOUS';
  penaltyFeeInMicrounits: number; // 40€ indemnité forfaitaire légale
  interestAmountInMicrounits: number;
  totalClaimInMicrounits: number;
}

/**
 * ⚖️ DunningWorkflowService (Item 5.3)
 * Service de gestion des relances d'impayés B2B (événements / privatisations).
 * Calcule l'indemnité forfaitaire légale de recouvrement (40€ Article L441-10 du Code de commerce) et le taux d'intérêt légal.
 */
export class DunningWorkflowService {
  static evaluateDunningStep(invoice: OverdueInvoiceItem): DunningActionResult {
    const fixedFeeMicrounits = 40_000_000; // 40€ en microunits
    const legalAnnualInterestRate = 0.12; // 12% taux pénalités retard B2B

    const dailyInterest = (invoice.amountDueInMicrounits * legalAnnualInterestRate) / 365;
    const interestAmount = Math.round(dailyInterest * invoice.daysOverdue);

    let step: DunningActionResult['step'] = 'REMINDER_SOFT';

    if (invoice.daysOverdue > 60) {
      step = 'FORMAL_NOTICE_CONTENTIOUS';
    } else if (invoice.daysOverdue > 30) {
      step = 'REMINDER_FIRM';
    }

    const totalClaim = invoice.amountDueInMicrounits + fixedFeeMicrounits + interestAmount;

    logger.info(`[DunningWorkflowService] Facture ${invoice.invoiceId} (${invoice.daysOverdue}j retard) -> Étape: ${step}, Créance totale: ${(totalClaim / 1_000_000).toFixed(2)}€`);

    empireAudit.log({
      module: 'accounting',
      action: 'DUNNING_STEP_EVALUATED',
      details: { invoiceId: invoice.invoiceId, step, totalClaimInMicrounits: totalClaim },
      severity: step === 'FORMAL_NOTICE_CONTENTIOUS' ? 'high' : 'low',
      timestamp: new Date(),
    });

    return {
      invoiceId: invoice.invoiceId,
      step,
      penaltyFeeInMicrounits: fixedFeeMicrounits,
      interestAmountInMicrounits: interestAmount,
      totalClaimInMicrounits: totalClaim,
    };
  }
}
