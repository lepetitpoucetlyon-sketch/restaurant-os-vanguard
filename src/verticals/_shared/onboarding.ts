/**
 * §8.6 Vague 5 — Résolveur des profils d'onboarding par verticale.
 * Motif identique à resolveMetricLabels / resolveEventFormules.
 * Défaut 'restaurant' → comportement historique préservé.
 */
import type { PlatformVariant } from '@nexus/contracts';
import type { FloorPlanProfile, SourceSystem } from './onboarding.types';

import { floorPlanProfile as restaurant, sourceSystems as restaurantSystems } from '@/verticals/restaurant/onboarding';
import { floorPlanProfile as hotel,      sourceSystems as hotelSystems      } from '@/verticals/hotel/onboarding';
import { floorPlanProfile as bakery,     sourceSystems as bakerySystems     } from '@/verticals/bakery/onboarding';
import { floorPlanProfile as garage,     sourceSystems as garageSystems     } from '@/verticals/garage/onboarding';
import { floorPlanProfile as salon,      sourceSystems as salonSystems      } from '@/verticals/salon/onboarding';
import { floorPlanProfile as clinic,     sourceSystems as clinicSystems     } from '@/verticals/clinic/onboarding';
import { floorPlanProfile as retail,     sourceSystems as retailSystems     } from '@/verticals/retail/onboarding';

const PROFILE_REGISTRY: Record<PlatformVariant, FloorPlanProfile> = {
  restaurant,
  hotel,
  bakery,
  garage,
  salon,
  clinic,
  retail,
  custom: restaurant,
};

const SYSTEMS_REGISTRY: Record<PlatformVariant, SourceSystem[]> = {
  restaurant: restaurantSystems,
  hotel:      hotelSystems,
  bakery:     bakerySystems,
  garage:     garageSystems,
  salon:      salonSystems,
  clinic:     clinicSystems,
  retail:     retailSystems,
  custom:     restaurantSystems,
};

export function resolveFloorPlanProfile(variant: PlatformVariant = 'restaurant'): FloorPlanProfile {
  return PROFILE_REGISTRY[variant] ?? restaurant;
}

export function resolveSourceSystems(variant: PlatformVariant = 'restaurant'): SourceSystem[] {
  return SYSTEMS_REGISTRY[variant] ?? restaurantSystems;
}

export type { FloorPlanProfile, SourceSystem } from './onboarding.types';
