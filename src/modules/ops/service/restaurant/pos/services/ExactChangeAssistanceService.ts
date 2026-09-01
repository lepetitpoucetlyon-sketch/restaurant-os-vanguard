export interface ChangeDenomination {
  name: string;
  valueInMicrounits: number;
  count: number;
}

export interface ChangeCalculationResult {
  totalDueInMicrounits: number;
  tenderedInMicrounits: number;
  changeDueInMicrounits: number;
  isExactChange: boolean;
  isUnderpaid: boolean;
  breakdown: ChangeDenomination[];
}

/**
 * Standard Euro Denominations in descending order (microunits).
 */
const EURO_DENOMINATIONS: { name: string; valueInMicrounits: number }[] = [
  { name: 'Billet 100€', valueInMicrounits: 100_000_000 },
  { name: 'Billet 50€', valueInMicrounits: 50_000_000 },
  { name: 'Billet 20€', valueInMicrounits: 20_000_000 },
  { name: 'Billet 10€', valueInMicrounits: 10_000_000 },
  { name: 'Billet 5€', valueInMicrounits: 5_000_000 },
  { name: 'Pièce 2€', valueInMicrounits: 2_000_000 },
  { name: 'Pièce 1€', valueInMicrounits: 1_000_000 },
  { name: 'Pièce 50c', valueInMicrounits: 500_000 },
  { name: 'Pièce 20c', valueInMicrounits: 200_000 },
  { name: 'Pièce 10c', valueInMicrounits: 100_000 },
  { name: 'Pièce 5c', valueInMicrounits: 50_000 },
  { name: 'Pièce 2c', valueInMicrounits: 20_000 },
  { name: 'Pièce 1c', valueInMicrounits: 10_000 },
];

/**
 * ExactChangeAssistanceService — Angle mort A6.
 * Calcule instantanément le rendu de monnaie optimal avec ventilation précise par billet et pièce.
 */
export class ExactChangeAssistanceService {
  static computeChange(
    totalDueInMicrounits: number,
    tenderedInMicrounits: number
  ): ChangeCalculationResult {
    if (totalDueInMicrounits < 0 || tenderedInMicrounits < 0) {
      throw new Error('[CHANGE-ASSIST] Amounts cannot be negative');
    }

    const changeDueInMicrounits = tenderedInMicrounits - totalDueInMicrounits;

    if (changeDueInMicrounits < 0) {
      return {
        totalDueInMicrounits,
        tenderedInMicrounits,
        changeDueInMicrounits: 0,
        isExactChange: false,
        isUnderpaid: true,
        breakdown: [],
      };
    }

    if (changeDueInMicrounits === 0) {
      return {
        totalDueInMicrounits,
        tenderedInMicrounits,
        changeDueInMicrounits: 0,
        isExactChange: true,
        isUnderpaid: false,
        breakdown: [],
      };
    }

    let remaining = changeDueInMicrounits;
    const breakdown: ChangeDenomination[] = [];

    for (const denom of EURO_DENOMINATIONS) {
      if (remaining >= denom.valueInMicrounits) {
        const count = Math.floor(remaining / denom.valueInMicrounits);
        remaining -= count * denom.valueInMicrounits;
        breakdown.push({
          name: denom.name,
          valueInMicrounits: denom.valueInMicrounits,
          count,
        });
      }
    }

    return {
      totalDueInMicrounits,
      tenderedInMicrounits,
      changeDueInMicrounits,
      isExactChange: false,
      isUnderpaid: false,
      breakdown,
    };
  }
}
