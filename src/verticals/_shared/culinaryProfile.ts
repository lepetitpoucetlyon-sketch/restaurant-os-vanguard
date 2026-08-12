import type { PlatformVariant } from '@nexus/contracts';

/**
 * 🍽️ §8.6 — Profil culinaire par verticale
 *
 * Prédicat partagé qui détermine si une verticale porte une sémantique
 * culinaire (stock d'ingrédients périssables + hygiène alimentaire HACCP +
 * recettes + food-cost + auto-86 + menu-engineering + food-donation).
 *
 * Origine : `logistics/stock/inventory/stockProfile.ts` (§8.6 12/08). Généralisé
 * ici parce que le même prédicat gate désormais la surface HACCP (`haccp.sync.ts`),
 * les overlays donation/menu-engineering, et à terme les mounts kitchen/kds/recipes.
 *
 * Une verticale non-culinaire (garage = pièces, salon = produits, retail non-food
 * = SKU, clinic = consommables) n'a pas besoin de ces overlays : les activer
 * abonne des collections Firestore vides et fait tourner du travail fantôme.
 *
 * ⚠️ Extension future — retail alimentaire (épicerie, cave à vin) : ajouter
 * un affinage via `capabilities.food` sans toucher ce défaut sûr.
 */
const CULINARY_VARIANTS: ReadonlySet<PlatformVariant> = new Set<PlatformVariant>([
  'restaurant',
  'hotel',
  'bakery',
]);

/**
 * Vrai si la verticale porte une sémantique culinaire (stock ingrédients /
 * recettes / food-cost / auto-86 / HACCP alimentaire / donation).
 * Défaut `'restaurant'` → comportement historique préservé pour tout appelant
 * qui ne précise pas le variant.
 */
export function usesCulinaryStock(variant: PlatformVariant = 'restaurant'): boolean {
  return CULINARY_VARIANTS.has(variant);
}
