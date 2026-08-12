import type { PlatformVariant } from '@nexus/contracts';

/**
 * 📦 §8.6 — Profil de stock par verticale
 *
 * Lève le présupposé restaurant « tout item de stock est un ingrédient
 * périssable relié à une recette ». Le cœur du stock (SKU, quantité, coût,
 * mouvements, seuils, commandes fournisseurs) est générique — voir
 * `inventory-service.ts`. Ce qui est SPÉCIFIQUE au culinaire :
 *
 *   - recettes (nomenclature ingrédients + CycleGuard DAG),
 *   - food-cost recompute (coût matière d'un plat),
 *   - auto-86 (indisponibilité menu quand un ingrédient tombe à zéro).
 *
 * Pour une verticale non-culinaire (garage = pièces, salon = produits,
 * retail = SKU, clinic = consommables), ces overlays sont inertes : les
 * lancer à chaque sync est du travail fantôme + un abonnement Firestore
 * sur une collection `recipes` vide. On les gate ici.
 *
 * Décision explicite et vertical-keyed (même motif que `bar` dans
 * ProvisioningEngine). Les verticales pourront affiner via `capabilities`
 * dans un second temps sans toucher ce défaut sûr.
 */
const CULINARY_STOCK_VARIANTS: ReadonlySet<PlatformVariant> = new Set<PlatformVariant>([
  'restaurant',
  'hotel',
  'bakery',
]);

/**
 * Vrai si la verticale porte une sémantique de stock culinaire
 * (recettes / food-cost / auto-86). Défaut `'restaurant'` → comportement
 * historique préservé pour tout appelant qui ne précise pas le variant.
 */
export function usesCulinaryStock(variant: PlatformVariant = 'restaurant'): boolean {
  return CULINARY_STOCK_VARIANTS.has(variant);
}
