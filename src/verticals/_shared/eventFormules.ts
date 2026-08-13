/**
 * §8.6 Vague 3 — Formules événementielles par verticale.
 *
 * Remplace les FORMULE_OPTIONS hardcodées ("Menu assis") dans EventQuoteModal
 * et EventQuoteFormSections par un résolveur vertical-aware.
 * Même motif que resolveMetricLabels / resolveCleaningZones.
 */
import type { PlatformVariant } from '@nexus/contracts';
import type { PrivatisationFormule } from '@/modules/commerce';

export interface EventFormuleOption {
  value: PrivatisationFormule;
  label: string;
  desc: string;
}

const RESTAURANT_FORMULES: EventFormuleOption[] = [
  { value: 'menu',             label: 'Menu assis',       desc: 'Service à la table, menu servi' },
  { value: 'cocktail_dinatoire', label: 'Cocktail dînatoire', desc: 'Buffet debout, service circulant' },
  { value: 'buffet',           label: 'Buffet libre',      desc: 'Self-service, convives libres' },
];

const HOTEL_FORMULES: EventFormuleOption[] = [
  { value: 'menu',             label: 'Gala dîner assis',  desc: 'Service gastronomique à la table' },
  { value: 'cocktail_dinatoire', label: 'Cocktail réception', desc: 'Standing, canapés, service circulant' },
  { value: 'buffet',           label: 'Buffet séminaire',  desc: 'Self-service, pauses café incluses' },
];

const BAKERY_FORMULES: EventFormuleOption[] = [
  { value: 'buffet',           label: 'Buffet pâtissier',  desc: 'Viennoiseries & gâteaux, self-service' },
  { value: 'cocktail_dinatoire', label: 'Atelier dégust.',  desc: 'Dégustation guidée avec l\'équipe' },
  { value: 'menu',             label: 'Commande privée',   desc: 'Commande sur mesure livrée sur place' },
];

const PROFESSIONAL_FORMULES: EventFormuleOption[] = [
  { value: 'menu',             label: 'Réunion formule',   desc: 'Salle + pause déjeuner organisée' },
  { value: 'cocktail_dinatoire', label: 'Cocktail pro',     desc: 'Standing, petits fours, networking' },
  { value: 'buffet',           label: 'Buffet déjeuner',   desc: 'Self-service sur place' },
];

const REGISTRY: Record<PlatformVariant, EventFormuleOption[]> = {
  restaurant: RESTAURANT_FORMULES,
  hotel:      HOTEL_FORMULES,
  bakery:     BAKERY_FORMULES,
  garage:     PROFESSIONAL_FORMULES,
  salon:      PROFESSIONAL_FORMULES,
  clinic:     PROFESSIONAL_FORMULES,
  retail:     PROFESSIONAL_FORMULES,
  custom:     RESTAURANT_FORMULES,
};

export function resolveEventFormules(variant: PlatformVariant = 'restaurant'): EventFormuleOption[] {
  return REGISTRY[variant] ?? RESTAURANT_FORMULES;
}
