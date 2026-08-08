import type { ICollectiveAgreement } from './types';

// À valider avec expert-comptable avant mise en prod
export const CLINIC_CONVENTION: ICollectiveAgreement = {
  id: 'clinic',
  name: 'Convention Hospitalisation Privée (IDCC 2264)',
  normalWeeklyHours: 35,
  ot25ThresholdHours: 8,
  nightStartHour: 21,
  nightBonusPct: 25,
  sundayBonusPct: 50,
  holidayBonusPct: 100,
  mealBenefitEur: 0,
};
