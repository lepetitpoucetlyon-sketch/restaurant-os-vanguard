/**
 * 💸 MicrounitAdapter - (Grade X Financial Infrastructure)
 * 
 * Définit les "Branded Types" stricts pour empêcher les erreurs mathématiques
 * entre les centimes classiques (ex: Stripe) et les micro-unités (µ-centimes).
 * 
 * 10000 µ-centimes = 1€
 * 100 centimes = 1€
 */

export type MicroUnit = number & { readonly __brand: 'micro' };
export type Centime = number & { readonly __brand: 'centime' };

export class MicrounitAdapter {
  
  /**
   * Convertit un montant métier (µ-centimes) vers Stripe (centimes).
   * Arrondit toujours à l'entier le plus proche pour éviter les décimales Stripe.
   */
  static toPSP(amount: MicroUnit): Centime {
    return Math.round(amount / 100) as Centime;
  }

  /**
   * Convertit un retour Stripe (centimes) vers le format métier (µ-centimes).
   */
  static toDomain(amount: Centime): MicroUnit {
    return (amount * 100) as MicroUnit;
  }

  /**
   * Addition sécurisée de deux micro-unités.
   */
  static add(a: MicroUnit, b: MicroUnit): MicroUnit {
    return (a + b) as MicroUnit;
  }
}
