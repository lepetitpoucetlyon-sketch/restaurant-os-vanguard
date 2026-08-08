import type { ICollectiveAgreement } from './types';

export const HCR_CONVENTION: ICollectiveAgreement = {
  id: 'hcr',
  name: 'Convention Collective HCR (IDCC 1979)',
  normalWeeklyHours: 35,
  ot25ThresholdHours: 8,
  nightStartHour: 21,
  nightBonusPct: 25,
  sundayBonusPct: 50,
  holidayBonusPct: 100,
  mealBenefitEur: 4.15,
};
