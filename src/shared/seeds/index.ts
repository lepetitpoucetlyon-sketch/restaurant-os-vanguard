import type { TenantConfig } from '@shared/nexus-contract';
import type { PlatformVariant } from '@/domain/schemas/tenant';
import { RESTAURANT_FULL_DNA } from './restaurant-full-dna';
import { HOTEL_FULL_DNA } from './hotel-full-dna';

const DNA_REGISTRY: Record<string, TenantConfig> = {
  restaurant: RESTAURANT_FULL_DNA,
  hotel: HOTEL_FULL_DNA,
};

export function resolveDNA(variant: PlatformVariant): TenantConfig {
  return DNA_REGISTRY[variant] ?? RESTAURANT_FULL_DNA;
}

export function getAvailableVariants(): PlatformVariant[] {
  return Object.keys(DNA_REGISTRY) as PlatformVariant[];
}

export { RESTAURANT_FULL_DNA } from './restaurant-full-dna';
export { HOTEL_FULL_DNA } from './hotel-full-dna';
