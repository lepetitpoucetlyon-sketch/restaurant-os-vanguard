import type { ICollectiveAgreement } from './types';

// À valider avec expert-comptable avant mise en prod
export const SALON_CONVENTION: ICollectiveAgreement = {
  id: 'salon',
  name: 'Convention Collective Coiffure et Soins (IDCC 2596)',
  normalWeeklyHours: 35,
  ot25ThresholdHours: 8,
  nightStartHour: 21,
  nightBonusPct: 25,
  sundayBonusPct: 100,
  holidayBonusPct: 100,
  mealBenefitEur: 0,
};
