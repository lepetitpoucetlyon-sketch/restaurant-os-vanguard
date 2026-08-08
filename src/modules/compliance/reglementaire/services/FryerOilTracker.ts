export interface FryerOilControl {
  fryerId: string;
  polarPercentage: number;
  isOilChanged: boolean;
  inspectedBy: string;
  timestamp: string;
}

/**
 * 🍟 FryerOilTracker (Item 7.2)
 * Registre légal de contrôle polarimétrique des huiles de friture HCR.
 * Alerte en cas de dépassement du seuil légal de 25% de composés polaires (Décret 2008-1110).
 */
export class FryerOilTracker {
  static evaluateControl(control: FryerOilControl): { isConform: boolean; alertRequired: boolean; message: string } {
    if (control.polarPercentage > 25) {
      return {
        isConform: false,
        alertRequired: true,
        message: `Composés polaires à ${control.polarPercentage}% (> 25% limite légale). Bain de friture hors conformité — Vidange obligatoire.`,
      };
    }

    if (control.polarPercentage > 20) {
      return {
        isConform: true,
        alertRequired: false,
        message: `Composés polaires à ${control.polarPercentage}%. Prévoir la vidange prochainement.`,
      };
    }

    return {
      isConform: true,
      alertRequired: false,
      message: `Composés polaires à ${control.polarPercentage}%. Bain de friture conforme.`,
    };
  }
}
