/**
 * 📚 Registre par défaut des règles d'angles morts.
 *
 * Agrégation des 4 familles fondatrices (20 règles). Le détecteur consomme ce
 * `DEFAULT_RULES` par défaut ; un appelant peut fournir un registre custom
 * (subset, extension, tests) via l'option `rules` de `detectVerticalBlindSpots`
 * / `detectTenantBlindSpots`.
 *
 * Ajouter une famille = créer un fichier + le pousser ici. Simple, testable.
 */

import type { BlindSpotRule } from '../BlindSpotDetector';
import { REGULATORY_RULES } from './regulatory';
import { SCALE_TIER_RULES } from './scale-tier';
import { CATALOG_CAPABILITY_RULES } from './catalog-capability';
import { CASCADE_RULES } from './cascade';

export * from './regulatory';
export * from './scale-tier';
export * from './catalog-capability';
export * from './cascade';

/** Registre par défaut : 4 familles × 5 règles = 20 règles fondatrices. */
export const DEFAULT_RULES: readonly BlindSpotRule[] = [
    ...REGULATORY_RULES,
    ...SCALE_TIER_RULES,
    ...CATALOG_CAPABILITY_RULES,
    ...CASCADE_RULES,
];
