import type { ICollectiveAgreement } from './types';

export const AUTO_CONVENTION: ICollectiveAgreement = {
  id: 'auto',
  name: 'Convention Services de l Automobile (IDCC 1090)',
  normalWeeklyHours: 35,
  ot25ThresholdHours: 8,
  nightStartHour: 22,
  nightBonusPct: 20,
  sundayBonusPct: 100,
  holidayBonusPct: 100,
  mealBenefitEur: 0,
};
