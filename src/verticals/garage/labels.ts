import type { MetricLabels } from '@/verticals/_shared/labels.types';

/** 🔧 Libellés métier garage — intervention + baie + mécanicien. */
export const metricLabels: MetricLabels = {
  unit:           'intervention',
  unitPlural:     'interventions',
  spatialContext: 'baie',
  merchantKind:   'garage',
  server:         'mécanicien',
  prepTicket:     'ordre de réparation',
  recipeLabel:    'forfait réparation',
  itemLabel:      'pièce détachée',
  customerLabel:  'automobiliste',
};
