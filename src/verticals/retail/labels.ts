import type { MetricLabels } from '@/verticals/_shared/labels.types';

/** 🛍️ Libellés métier retail — vente + rayon + vendeur. */
export const metricLabels: MetricLabels = {
  unit:           'vente',
  unitPlural:     'ventes',
  spatialContext: 'rayon',
  merchantKind:   'commerce',
  server:         'vendeur',
  prepTicket:     'bon de préparation',
};
