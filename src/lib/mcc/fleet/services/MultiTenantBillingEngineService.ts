import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

export interface SaaSUsageBillingInput {
  tenantId: string;
  periodLabel: string; // '2026-08'
  planBaseFeeInMicrounits: number; // ex: 99.00 € (99_000_000)
  activePosTerminalCount: number;
  terminalFeeInMicrounits: number; // ex: 29.00 € / terminal
  totalVolumeProcessedInMicrounits: number;
  variableCommissionBps: number; // ex: 50 bps = 0.50%
}

export interface SaaSInvoiceBreakdown {
  invoiceId: string;
  tenantId: string;
  periodLabel: string;
  baseFeeInMicrounits: number;
  terminalsFeeInMicrounits: number;
  variableVolumeFeeInMicrounits: number;
  totalBeforeTaxInMicrounits: number;
  taxVatInMicrounits: number; // 20% TVA
  totalTtcInMicrounits: number;
}

/**
 * MultiTenantBillingEngineService — Angle mort MCC-A2.
 * Moteur de facturation SaaS multi-tenant du MCC :
 * Calcul de l'abonnement mensuel, frais par terminal actif et commissions variables sur volume d'encaissement avec émission de facture TVA 20%.
 */
export class MultiTenantBillingEngineService {
  static async generateMonthlySaaSInvoice(
    adminId: string,
    input: SaaSUsageBillingInput,
    ipAddress: string = 'unknown'
  ): Promise<SaaSInvoiceBreakdown> {
    const terminalsFeeInMicrounits = input.activePosTerminalCount * input.terminalFeeInMicrounits;
    const variableVolumeFeeInMicrounits = Math.round((input.totalVolumeProcessedInMicrounits * input.variableCommissionBps) / 10_000);

    const totalBeforeTaxInMicrounits = input.planBaseFeeInMicrounits + terminalsFeeInMicrounits + variableVolumeFeeInMicrounits;
    const taxVatInMicrounits = Math.round(totalBeforeTaxInMicrounits * 0.20);
    const totalTtcInMicrounits = totalBeforeTaxInMicrounits + taxVatInMicrounits;

    const invoiceId = `INV-SAAS-${input.tenantId}-${input.periodLabel}`;

    NexusEventBus.emit('fleet.saas_billing_invoiced', {
      v: 1,
      tenantId: input.tenantId,
      invoiceId,
      periodLabel: input.periodLabel,
      totalAmountInMicrounits: totalTtcInMicrounits,
      invoiceStatus: 'issued',
      invoicedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'SAAS_BILLING_INVOICED',
      targetId: invoiceId,
      ipAddress,
      metadata: {
        totalTtcInMicrounits,
        activeTerminals: input.activePosTerminalCount,
      },
    });

    return {
      invoiceId,
      tenantId: input.tenantId,
      periodLabel: input.periodLabel,
      baseFeeInMicrounits: input.planBaseFeeInMicrounits,
      terminalsFeeInMicrounits,
      variableVolumeFeeInMicrounits,
      totalBeforeTaxInMicrounits,
      taxVatInMicrounits,
      totalTtcInMicrounits,
    };
  }
}
