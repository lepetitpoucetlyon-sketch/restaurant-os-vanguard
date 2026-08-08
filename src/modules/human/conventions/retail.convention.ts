import type { ICollectiveAgreement } from './types';

// À valider avec expert-comptable avant mise en prod
export const RETAIL_CONVENTION: ICollectiveAgreement = {
  id: 'retail',
  name: 'Convention Commerce de Détail Non Alimentaire (IDCC 1517)',
  normalWeeklyHours: 35,
  ot25ThresholdHours: 8,
  nightStartHour: 21,
  nightBonusPct: 25,
  sundayBonusPct: 100,
  holidayBonusPct: 100,
  mealBenefitEur: 0,
};
