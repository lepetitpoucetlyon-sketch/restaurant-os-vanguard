import { z } from 'zod';

/**
 * 🏛️ SOVEREIGN PRIMITIVES - Grade X DNA
 * Standardized types for the entire Restaurant OS Core.
 */

// Microunits branded type (1 unit = 1,000,000 units)
// Prevents accidental mix with cents or floats
export const MicrounitsSchema = z.number()
  .int('Les microunités doivent être un entier')
  .min(0, 'Une valeur financière ne peut pas être négative')
  .brand<'Microunits'>();

export type Microunits = z.infer<typeof MicrounitsSchema>;

/**
 * Convertit un nombre en `Microunits` avec application réelle de l'invariant.
 *
 * Avant : simple `val as Microunits` — le type brandé n'offrait AUCUNE garantie
 * runtime, et rien n'empêchait un flottant, un négatif ou une valeur en centimes
 * d'entrer dans la chaîne financière (cf. `MicrounitsSchema` : entier ≥ 0).
 *
 * Stratégie par environnement :
 *  - dev / test : lève immédiatement — la violation doit être corrigée à la source.
 *  - production : normalise (arrondi + clamp) et journalise en `error`. Un artefact
 *    d'arrondi ne doit jamais faire échouer une vente en cours, mais il doit rester
 *    visible et diagnosticable côté observabilité.
 */
export const toMicrounits = (val: number): Microunits => {
  if (Number.isInteger(val) && val >= 0) return val as Microunits;

  const reason = !Number.isFinite(val)
    ? `valeur non finie (${val})`
    : !Number.isInteger(val)
      ? `flottant (${val}) — les microunités doivent être entières`
      : `négatif (${val}) — une valeur financière ne peut pas être négative`;

  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`MICROUNITS_INVARIANT_VIOLATION: ${reason}`);
  }

  // Production : normalisation défensive + trace.
  const normalized = Number.isFinite(val) ? Math.max(0, Math.round(val)) : 0;
  console.error(`[Microunits] Invariant violé — ${reason}. Normalisé en ${normalized}.`);
  return normalized as Microunits;
};

// Raw string with sanitization - to be used via .pipe(SanitizedStringSchema)
// Raw string with sanitization - internal base
const RawSanitizer = z.string()
  .trim()
  .transform(val =>
    val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[<>"'`]/g, '')
      .trim()
  );

/**
 * 🏛️ Sanitized Helper - Grade X Standard
 * Ensures validation (min/max) happens AFTER the sanitization transform.
 */
export const sanitized = (min: number, max: number) =>
  RawSanitizer.pipe(
    z.string()
      .min(min, `Minimum ${min} caractère(s) après nettoyage`)
      .max(max, `Maximum ${max} caractères après nettoyage`)
  );

// Legacy compatibility (to be phased out)
export const SanitizedStringSchema = RawSanitizer;

// Unified Timestamp - accepts string (ISO), number (ms), or Firestore Timestamp object
export const TimestampSchema = z.union([
  z.number().int().positive(),
  z.string().datetime({ offset: true }),
  z.object({ toMillis: z.any() }),
]).transform((val): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return new Date(val).getTime();
  // Firestore Timestamp object
  if (val && typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
});

// Strict UUID Schema
export const UUIDSchema = z.string().uuid('Format UUID v4 requis');

// Legal Tax Rates (France)
export const TaxRateSchema = z.enum(['0.055', '0.10', '0.20']);

export type TaxRate = z.infer<typeof TaxRateSchema>;

// Sovereign Status types
export const StatusSchema = z.enum(['active', 'inactive', 'suspended', 'on_leave', 'RESTRICTED', 'archived']);
