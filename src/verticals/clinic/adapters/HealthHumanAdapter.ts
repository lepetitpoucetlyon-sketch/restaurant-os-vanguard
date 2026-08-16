import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeHumanAdapter } from '@/verticals/_shared/adapters';

/** RH clinique = socle universel (shift/heures sup) + delta praticien de garde. */
export const HealthHumanAdapter = {
  ...makeHumanAdapter(),
  emitPractitionerOnCall(payload: { tenantId: string; practitionerId: string; specialty: string; onCallFrom: string; onCallUntil: string }) {
    NexusEventBus.emit('health.practitioner_on_call', payload);
  },
};
