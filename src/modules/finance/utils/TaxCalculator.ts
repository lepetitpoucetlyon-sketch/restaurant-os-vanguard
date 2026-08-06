/**
 * Calcul réglementaire NF525 de la TVA — arithmétique entière pure (BigInt).
 * Aucune opération sur flottants : élimine les dérives de microunités.
 */
export class TaxCalculator {
  /**
   * Applique un taux de TVA (chaîne décimale, ex: '0.10') à un montant en microunités.
   *
   * Algorithme :
   *   1. Décompose le taux en (intPart, decPart) via split('.')
   *   2. Normalise decPart à exactement 6 chiffres → scaled = taux × 1 000 000 (entier)
   *   3. Calcule en BigInt : (montant × scaled) / 1 000 000
   *
   * Exemples French TVA :
   *   '0.20'  → scaled = 200 000
   *   '0.10'  → scaled = 100 000
   *   '0.055' → scaled =  55 000
   *   '0.021' → scaled =  21 000
   *   '0'     → scaled =       0
   */
  static applyRate(amountInMicrounits: number, rateString: string): number {
    if (!Number.isFinite(amountInMicrounits) || amountInMicrounits === 0) return 0;
    const PRECISION = 1_000_000n;
    const [intPart = '0', decPart = ''] = rateString.split('.');
    const scaled = BigInt(intPart) * PRECISION + BigInt(decPart.padEnd(6, '0').slice(0, 6));
    return Number(BigInt(Math.round(amountInMicrounits)) * scaled / PRECISION);
  }
}
