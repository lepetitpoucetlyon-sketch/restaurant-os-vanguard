import type { MetricLabels } from '@/verticals/_shared/labels.types';

/** 🏨 Libellés métier hôtel — nuitée + chambre + réceptionniste. */
export const metricLabels: MetricLabels = {
  unit:           'nuitée',
  unitPlural:     'nuitées',
  spatialContext: 'chambre',
  merchantKind:   'hôtel',
  server:         'réceptionniste',
  prepTicket:     'bon housekeeping',
  recipeLabel:    'forfait séjour',
  itemLabel:      'fourniture chambre',
  customerLabel:  'résident',
};
