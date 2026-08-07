import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoComplianceAdapter = {
  emitCertificationExpiry(payload: { tenantId: string; vehicleId: string; certType: 'ct' | 'pollution'; expiresAt: string }) {
    NexusEventBus.emitDurable('auto.certification_expiry', payload);
  },
};
