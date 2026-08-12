import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HealthHumanAdapter = {
  emitPractitionerOnCall(payload: { tenantId: string; practitionerId: string; specialty: string; onCallFrom: string; onCallUntil: string }) {
    NexusEventBus.emit('health.practitioner_on_call', payload);
  },
};
