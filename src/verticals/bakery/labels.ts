import type { MetricLabels } from '@/verticals/_shared/labels.types';

/** 🥖 Libellés métier boulangerie — vente + comptoir + vendeur. */
export const metricLabels: MetricLabels = {
  unit:           'vente',
  unitPlural:     'ventes',
  spatialContext: 'comptoir',
  merchantKind:   'boulangerie',
  server:         'vendeur',
  prepTicket:     'ordre de fournée',
  recipeLabel:    'recette de pâtisserie',
  itemLabel:      'matière première',
  customerLabel:  'client',
};
