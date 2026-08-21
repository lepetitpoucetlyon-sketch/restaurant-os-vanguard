export interface ComboItemComponent {
  productId: string;
  name: string;
  standalonePriceInMicrounits: number; // Prix à la carte hors formule
  taxRate: '0.055' | '0.10' | '0.20';
}

export interface ComboTaxProrataRequest {
  comboName: string;
  comboFixedPriceInMicrounits: number; // Prix forfaitaire de la formule (ex: 18.50€)
  components: ComboItemComponent[];
}

export interface ProratedTaxLine {
  productId: string;
  name: string;
  taxRate: string;
  proratedTtcInMicrounits: number;
  proratedHtInMicrounits: number;
  proratedTaxInMicrounits: number;
  ratioAppliedPct: number;
}

export interface ComboTaxProrataResult {
  comboFixedPriceInMicrounits: number;
  lines: ProratedTaxLine[];
  totalHtInMicrounits: number;
  totalTaxInMicrounits: number;
  totalTtcInMicrounits: number;
  isExactCentimeSum: boolean;
}

/**
 * MenuComboTaxProrataService — Angle mort L24.
 * Ventile la TVA d'une formule menu multi-taux (5,5% plat, 10% dessert/soft, 20% vin)
 * au prorata des prix à la carte avec application stricte de la règle du centime résiduel.
 */
export class MenuComboTaxProrataService {
  static computeProratedTax(req: ComboTaxProrataRequest): ComboTaxProrataResult {
    if (req.components.length === 0) {
      throw new Error('[COMBO-TAX] Cannot compute tax on empty combo components');
    }

    const sumStandaloneInMicrounits = req.components.reduce(
      (sum, c) => sum + c.standalonePriceInMicrounits,
      0
    );

    if (sumStandaloneInMicrounits <= 0) {
      throw new Error('[COMBO-TAX] Standalone sum must be greater than 0');
    }

    let allocatedTtc = 0;
    const lines: ProratedTaxLine[] = [];

    for (let i = 0; i < req.components.length; i++) {
      const comp = req.components[i];
      const isLast = i === req.components.length - 1;

      let proratedTtcInMicrounits: number;
      if (isLast) {
        // Last component takes residual centime to guarantee exact sum
        proratedTtcInMicrounits = req.comboFixedPriceInMicrounits - allocatedTtc;
      } else {
        const ratio = comp.standalonePriceInMicrounits / sumStandaloneInMicrounits;
        proratedTtcInMicrounits = Math.round(req.comboFixedPriceInMicrounits * ratio);
        allocatedTtc += proratedTtcInMicrounits;
      }

      const rateNum = parseFloat(comp.taxRate);
      const proratedHtInMicrounits = Math.round(proratedTtcInMicrounits / (1 + rateNum));
      const proratedTaxInMicrounits = proratedTtcInMicrounits - proratedHtInMicrounits;
      const ratioAppliedPct = Math.round((comp.standalonePriceInMicrounits / sumStandaloneInMicrounits) * 1000) / 10;

      lines.push({
        productId: comp.productId,
        name: comp.name,
        taxRate: comp.taxRate,
        proratedTtcInMicrounits,
        proratedHtInMicrounits,
        proratedTaxInMicrounits,
        ratioAppliedPct,
      });
    }

    const totalTtc = lines.reduce((sum, l) => sum + l.proratedTtcInMicrounits, 0);
    const totalHt = lines.reduce((sum, l) => sum + l.proratedHtInMicrounits, 0);
    const totalTax = lines.reduce((sum, l) => sum + l.proratedTaxInMicrounits, 0);

    return {
      comboFixedPriceInMicrounits: req.comboFixedPriceInMicrounits,
      lines,
      totalHtInMicrounits: totalHt,
      totalTaxInMicrounits: totalTax,
      totalTtcInMicrounits: totalTtc,
      isExactCentimeSum: totalTtc === req.comboFixedPriceInMicrounits,
    };
  }
}
