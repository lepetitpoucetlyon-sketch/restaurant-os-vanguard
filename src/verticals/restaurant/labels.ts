import type { MetricLabels } from '@/verticals/_shared/labels.types';

/**
 * 🍽️ Libellés métier restaurant. Défaut historique — préservé pour tout
 * appelant qui ne précise pas de variant.
 */
export const metricLabels: MetricLabels = {
  unit:           'couvert',
  unitPlural:     'couverts',
  spatialContext: 'table',
  merchantKind:   'restaurant',
  server:         'serveur',
  prepTicket:     'bon cuisine',
  recipeLabel:    'recette',
  itemLabel:      'ingrédient',
  customerLabel:  'convive',
};
