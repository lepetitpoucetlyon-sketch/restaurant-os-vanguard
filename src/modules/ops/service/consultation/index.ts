// Consultation — Generic consultation module (clinic, legal, accounting, etc.)
export type {
  Consultation,
  ConsultationStatus,
  ConsultationCreateInput,
} from './domain/types/consultation';

export { ConsultationService } from './application/services/ConsultationService';
export {
  consultationsAtom,
  consultationsLoadingAtom,
  consultationSelectedDateAtom,
  selectedPractitionerIdAtom,
  filteredConsultationsAtom,
} from './application/store/consultationsAtom';
