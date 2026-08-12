import type { MetricLabels } from '@/verticals/_shared/labels.types';

/** 💇 Libellés métier salon — prestation + poste + coiffeur. */
export const metricLabels: MetricLabels = {
  unit:           'prestation',
  unitPlural:     'prestations',
  spatialContext: 'poste',
  merchantKind:   'salon',
  server:         'coiffeur',
  prepTicket:     'fiche technique',
};
