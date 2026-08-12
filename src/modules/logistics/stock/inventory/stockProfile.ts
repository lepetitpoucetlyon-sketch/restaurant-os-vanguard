/**
 * @deprecated §8.6 Vague 1 — Le prédicat a été promu dans `@/verticals/_shared/culinaryProfile`
 * car il gate désormais aussi la surface HACCP. Ce module reste comme façade
 * rétrocompatible pour les 3 importateurs historiques du domaine stock.
 * Nouveau code : importer directement depuis `@/verticals/_shared/culinaryProfile`.
 */
export { usesCulinaryStock } from '@/verticals/_shared/culinaryProfile';
