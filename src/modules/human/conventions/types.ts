export interface ICollectiveAgreement {
  id: string;
  name: string;
  normalWeeklyHours: number;
  ot25ThresholdHours: number;
  nightStartHour: number;
  nightBonusPct: number;
  sundayBonusPct: number;
  holidayBonusPct: number;
  mealBenefitEur: number;
}
