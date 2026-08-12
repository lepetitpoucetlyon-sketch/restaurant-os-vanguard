/**
 * 🏷️ §8.6 Vague 2 — Résolveur centralisé des libellés métier par verticale.
 * Source unique de vérité pour les modules transverses (printers, widgets,
 * reports, marketing, reservations, fleet-benchmark) qui parlaient jusqu'ici
 * en dur de « couverts », « bon cuisine » ou « votre table est réservée ».
 *
 * Motif identique à `_shared/roles.ts` — le concept est invariant, le mot
 * pour le dire change d'une verticale à l'autre. Défaut `'restaurant'` →
 * comportement historique préservé pour tout appelant qui ne précise pas.
 */
import type { PlatformVariant } from '@nexus/contracts';
import type { MetricLabels } from './labels.types';

import { metricLabels as restaurant } from '@/verticals/restaurant/labels';
import { metricLabels as hotel }      from '@/verticals/hotel/labels';
import { metricLabels as bakery }     from '@/verticals/bakery/labels';
import { metricLabels as garage }     from '@/verticals/garage/labels';
import { metricLabels as salon }      from '@/verticals/salon/labels';
import { metricLabels as clinic }     from '@/verticals/clinic/labels';
import { metricLabels as retail }     from '@/verticals/retail/labels';

const REGISTRY: Record<PlatformVariant, MetricLabels> = {
  restaurant,
  hotel,
  bakery,
  garage,
  salon,
  clinic,
  retail,
  custom: restaurant, // Fallback sur restaurant — comportement historique
};

/**
 * Retourne l'objet complet de libellés métier pour la verticale active.
 * Défaut `'restaurant'` : un appelant qui ne passe pas de variant garde
 * l'ancien comportement (« couvert / table / bon cuisine »).
 */
export function resolveMetricLabels(variant: PlatformVariant = 'restaurant'): MetricLabels {
  return REGISTRY[variant] ?? restaurant;
}

/**
 * Sucre syntaxique : résout une seule clé sans destructurer l'objet.
 * Utile dans une string template : `${labelFor('unit', variant)}` au lieu
 * de `${resolveMetricLabels(variant).unit}`.
 */
export function labelFor(key: keyof MetricLabels, variant: PlatformVariant = 'restaurant'): string {
  return resolveMetricLabels(variant)[key];
}

export type { MetricLabels } from './labels.types';
