import { logger } from '@/lib/logger';
import type { IVerticalPlugin } from './IVerticalPlugin';
import type { PlatformVariant } from '@/domain/schemas/tenant';

type VerticalFactory = () => IVerticalPlugin;

const registry = new Map<PlatformVariant, VerticalFactory>();

export const VerticalRegistry = {
  register(variant: PlatformVariant, factory: VerticalFactory): void {
    registry.set(variant, factory);
    logger.info(`[VerticalRegistry] registered: ${variant}`);
  },

  resolve(variant: PlatformVariant): IVerticalPlugin {
    const factory = registry.get(variant);
    if (!factory) throw new Error(`[VerticalRegistry] No vertical registered for variant: ${variant}`);
    return factory();
  },

  list(): PlatformVariant[] {
    return Array.from(registry.keys());
  },
};

// Auto-registration — lazy imports avoid circular deps at module init
import('@/verticals/restaurant').then(m => VerticalRegistry.register('restaurant', () => new m.RestaurantVertical()));
import('@/verticals/hotel').then(m => VerticalRegistry.register('hotel', () => new m.HotelVertical()));
import('@/verticals/auto').then(m => VerticalRegistry.register('garage', () => new m.AutoVertical()));
import('@/verticals/health').then(m => VerticalRegistry.register('clinic', () => new m.HealthVertical()));
