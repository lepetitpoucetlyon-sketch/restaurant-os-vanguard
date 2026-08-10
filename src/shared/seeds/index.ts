import type { TenantConfig } from '@shared/nexus-contract';
import type { PlatformVariant } from '@nexus/contracts';
import { RESTAURANT_FULL_DNA } from './restaurant-full-dna';
import { HOTEL_FULL_DNA } from './hotel-full-dna';
import { BAKERY_FULL_DNA } from './bakery-full-dna';
import { SALON_FULL_DNA } from './salon-full-dna';
import { GARAGE_FULL_DNA } from './garage-full-dna';
import { RETAIL_FULL_DNA } from './retail-full-dna';
import { CLINIC_FULL_DNA } from './clinic-full-dna';

const DNA_REGISTRY: Record<string, TenantConfig> = {
  restaurant: RESTAURANT_FULL_DNA,
  hotel: HOTEL_FULL_DNA,
  bakery: BAKERY_FULL_DNA,
  salon: SALON_FULL_DNA,
  garage: GARAGE_FULL_DNA,
  retail: RETAIL_FULL_DNA,
  clinic: CLINIC_FULL_DNA,
};

export function resolveDNA(variant: PlatformVariant): TenantConfig {
  return DNA_REGISTRY[variant] ?? RESTAURANT_FULL_DNA;
}

export function getAvailableVariants(): PlatformVariant[] {
  return Object.keys(DNA_REGISTRY) as PlatformVariant[];
}

export { RESTAURANT_FULL_DNA } from './restaurant-full-dna';
export { HOTEL_FULL_DNA } from './hotel-full-dna';
export { BAKERY_FULL_DNA } from './bakery-full-dna';
export { SALON_FULL_DNA } from './salon-full-dna';
export { GARAGE_FULL_DNA } from './garage-full-dna';
export { RETAIL_FULL_DNA } from './retail-full-dna';
export { CLINIC_FULL_DNA } from './clinic-full-dna';
