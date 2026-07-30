/**
 * MicrounitAdapter - Grade X Financial Infrastructure
 *
 * Branded Types stricts : empêche les confusions entre centimes Stripe et µ métier.
 * Convention : 1 € = 1 000 000 µ — 1 centime Stripe = 10 000 µ
 */

export type MicroUnit = number & { readonly __brand: 'micro' };
export type Centime = number & { readonly __brand: 'centime' };

export class MicrounitAdapter {

  /** µ métier → centimes Stripe (PSP boundary). Arrondi entier (Stripe ne gère pas les décimales). */
  static toPSP(amount: MicroUnit): Centime {
    return Math.round(amount / 10_000) as Centime;
  }

  /** Centimes Stripe → µ métier (retour PSP boundary). */
  static toDomain(amount: Centime): MicroUnit {
    return (amount * 10_000) as MicroUnit;
  }

  /** Addition sécurisée de deux micro-unités. */
  static add(a: MicroUnit, b: MicroUnit): MicroUnit {
    return (a + b) as MicroUnit;
  }
}
