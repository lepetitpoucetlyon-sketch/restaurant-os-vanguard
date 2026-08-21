export interface BilingualReceiptFooter {
  legalNoticeFr: string;
  legalNoticeEn: string;
  gratuityPromptFr: string;
  gratuityPromptEn: string;
  suggestedTips: {
    percentage: number;
    amountInMicrounits: number;
    labelFr: string;
    labelEn: string;
  }[];
}

/**
 * BilingualTipGratuityHelper — Angle mort L81.
 * Clarifie la distinction légale française "Service 15% inclus" vs "Pourboire optionnel / Optional gratuity" pour éviter les malentendus et réclamations touristiques.
 */
export class BilingualTipGratuityHelper {
  public static readonly LEGAL_NOTICE_FR = 'Prix TTC — Service 15% inclus (Art. L. 113-3 Code de la consommation)';
  public static readonly LEGAL_NOTICE_EN = 'All prices include 15% service charge. Any additional tip is strictly optional and goes directly to the staff.';

  static formatBilingualFooter(totalInMicrounits: number): BilingualReceiptFooter {
    const tipPercentages = [5, 10, 15];

    const suggestedTips = tipPercentages.map(pct => {
      const amountInMicrounits = Math.round((totalInMicrounits * pct) / 100);
      const amountEuros = (amountInMicrounits / 1_000_000).toFixed(2);
      return {
        percentage: pct,
        amountInMicrounits,
        labelFr: `Pourboire optionnel ${pct}% (${amountEuros} €)`,
        labelEn: `Optional gratuity ${pct}% (€${amountEuros})`,
      };
    });

    return {
      legalNoticeFr: this.LEGAL_NOTICE_FR,
      legalNoticeEn: this.LEGAL_NOTICE_En,
      gratuityPromptFr: 'Le pourboire est laissé à votre entière discrétion.',
      gratuityPromptEn: 'Tips are entirely at your discretion.',
      suggestedTips,
    };
  }

  private static get LEGAL_NOTICE_En(): string {
    return this.LEGAL_NOTICE_EN;
  }
}
