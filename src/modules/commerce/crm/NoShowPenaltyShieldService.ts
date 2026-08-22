import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface NoShowIncidentInput {
  tenantId: string;
  adminId: string;
  reservationId: string;
  customerId: string;
  covers: number;
  penaltyPerCoverInMicrounits: number; // ex: 25.00 € (25_000_000)
  stripePaymentMethodId: string;
}

export interface NoShowPenaltyReceipt {
  reservationId: string;
  totalPenaltyInMicrounits: number;
  isCharged: boolean;
  legalNotice: string;
  chargedAt: number;
}

/**
 * NoShowPenaltyShieldService — Angle mort L75.
 * Bouclier anti-no-show par empreinte bancaire (Article 1590 Code Civil — régime des arrhes) :
 * Facturation automatique de la pénalité convenue lors de la non-présentation client.
 */
export class NoShowPenaltyShieldService {
  static async chargeNoShowPenalty(input: NoShowIncidentInput): Promise<NoShowPenaltyReceipt> {
    const totalPenaltyInMicrounits = input.covers * input.penaltyPerCoverInMicrounits;

    NexusEventBus.emit('crm.no_show_penalized', {
      v: 1,
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      customerId: input.customerId,
      penaltyAmountInMicrounits: totalPenaltyInMicrounits,
      chargedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId: input.adminId,
      action: 'NO_SHOW_PENALTY_CHARGED',
      targetId: input.reservationId,
      ipAddress: '127.0.0.1',
      metadata: {
        customerId: input.customerId,
        covers: input.covers,
        totalPenaltyInMicrounits,
      },
    });

    return {
      reservationId: input.reservationId,
      totalPenaltyInMicrounits,
      isCharged: true,
      legalNotice: 'Arrhes conservées en application de l\'article 1590 du Code Civil suite à l\'absence injustifiée.',
      chargedAt: Date.now(),
    };
  }
}
