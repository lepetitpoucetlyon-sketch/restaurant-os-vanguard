import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Finance clinique = socle universel + deltas actes CCAM & tiers-payant. */
export const HealthFinanceAdapter = {
  ...makeFinanceAdapter(),
  emitInsuranceClaimSubmitted(payload: { tenantId: string; patientId: string; claimId: string; amountInMicrounits: number; insurerId: string }) {
    NexusEventBus.emitDurable('health.insurance_claim_submitted', payload);
  },
  emitActBilled(payload: { tenantId: string; patientId: string; actCode: string; amountInMicrounits: number; practitionerId: string }) {
    NexusEventBus.emitDurable('health.act_billed', payload);
  },
};
