import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** Conformité garage = socle universel + delta expiration CT/pollution. */
export const AutoComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitCertificationExpiry(payload: { tenantId: string; vehicleId: string; certType: 'ct' | 'pollution'; expiresAt: string }) {
    NexusEventBus.emitDurable('auto.certification_expiry', payload);
  },
};
