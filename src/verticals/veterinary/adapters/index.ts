import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
  makeFinanceAdapter,
  makeMccAdapter,
  makeFacilityAdapter,
  makeCommerceAdapter,
  makeLogisticsAdapter,
  makeHumanAdapter,
  makeIntelligenceAdapter,
  makeComplianceAdapter,
} from '@/verticals/_shared/adapters';

export const VeterinaryFinanceAdapter = makeFinanceAdapter();
export const VeterinaryFacilityAdapter = makeFacilityAdapter();
export const VeterinaryLogisticsAdapter = makeLogisticsAdapter();
export const VeterinaryHumanAdapter = makeHumanAdapter();
export const VeterinaryIntelligenceAdapter = makeIntelligenceAdapter();
export const VeterinaryComplianceAdapter = makeComplianceAdapter();
export const VeterinaryMccAdapter = makeMccAdapter<{ activePatients?: number; surgeriesToday?: number }>();

export const VeterinaryCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitVaccineReminderSent(payload: { tenantId: string; animalId: string; ownerId: string; vaccineName: string }) {
    NexusEventBus.emitDurable('veterinary.vaccine_reminder_sent', payload);
  },
};

export const VeterinaryOpsAdapter = {
  emitPetConsultationCompleted(payload: { tenantId: string; consultationId: string; animalId: string; vetId: string }) {
    NexusEventBus.emitDurable('veterinary.pet_consultation_completed', payload);
  },
  emitIcadChipScanned(payload: { tenantId: string; icadNumber: string; animalId: string }) {
    NexusEventBus.emit('veterinary.icad_chip_scanned', payload);
  },
};
