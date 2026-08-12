import type { MetricLabels } from '@/verticals/_shared/labels.types';

/**
 * 🏥 Libellés métier clinique — consultation + cabinet + praticien.
 *
 * ⚠️ Note PII (§8.2) — les libellés ci-dessous sont neutres. Toute donnée
 * patient (nom, ID, motif) doit rester derrière `ServiceSubject.createPiiSubject`
 * et n'être jamais affichée en clair à travers ces libellés génériques.
 */
export const metricLabels: MetricLabels = {
  unit:           'consultation',
  unitPlural:     'consultations',
  spatialContext: 'cabinet',
  merchantKind:   'clinique',
  server:         'praticien',
  prepTicket:     'protocole de soin',
};
