import type { TenantConfig } from '@shared/nexus-contract';
import type { PlatformVariant } from '@/modules/system';
import { RESTAURANT_FULL_DNA } from './restaurant-full-dna';
import { HOTEL_FULL_DNA } from './hotel-full-dna';
import { BAKERY_FULL_DNA } from './bakery-full-dna';
import { SALON_FULL_DNA } from './salon-full-dna';
import { GARAGE_FULL_DNA } from './garage-full-dna';
import { RETAIL_FULL_DNA } from './retail-full-dna';
import { CLINIC_FULL_DNA } from './clinic-full-dna';
import { CUSTOM_FULL_DNA } from './custom-full-dna';
import { GYM_FULL_DNA } from './gym-full-dna';
import { COWORKING_FULL_DNA } from './coworking-full-dna';
import { VETERINARY_FULL_DNA } from './veterinary-full-dna';
import { FLORIST_FULL_DNA } from './florist-full-dna';

export const DNA_REGISTRY: Record<string, TenantConfig> = {
  restaurant: RESTAURANT_FULL_DNA,
  hotel: HOTEL_FULL_DNA,
  bakery: BAKERY_FULL_DNA,
  salon: SALON_FULL_DNA,
  garage: GARAGE_FULL_DNA,
  retail: RETAIL_FULL_DNA,
  clinic: CLINIC_FULL_DNA,
  custom: CUSTOM_FULL_DNA,
  gym: GYM_FULL_DNA,
  coworking: COWORKING_FULL_DNA,
  veterinary: VETERINARY_FULL_DNA,
  florist: FLORIST_FULL_DNA,
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
export { CUSTOM_FULL_DNA } from './custom-full-dna';
export { GYM_FULL_DNA } from './gym-full-dna';
export { COWORKING_FULL_DNA } from './coworking-full-dna';
export { VETERINARY_FULL_DNA } from './veterinary-full-dna';
export { FLORIST_FULL_DNA } from './florist-full-dna';

export { KICKERS_BY_VARIANT, resolveKicker, listKickerDomains, type KickerDomain } from './kickers';
