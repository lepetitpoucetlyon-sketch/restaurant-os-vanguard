import type { PlatformVariant } from '@/modules/system';
import type { IVerticalUIPlugin } from './IVerticalUIPlugin';

const registry = new Map<PlatformVariant, IVerticalUIPlugin>();

export const VerticalUIRegistry = {
  register(variant: PlatformVariant, plugin: IVerticalUIPlugin): void {
    registry.set(variant, plugin);
  },

  /**
   * Résout le plugin UI d'un vertical.
   * Fallback : si le variant n'est pas enregistré → null (pas d'exception).
   * Le VerticalUIProvider gère le null gracieusement.
   */
  resolve(variant: PlatformVariant): IVerticalUIPlugin | null {
    return registry.get(variant) ?? registry.get('custom') ?? null;
  },

  list(): PlatformVariant[] {
    return Array.from(registry.keys());
  },
};

// Auto-registration — lazy imports évitent les deps circulaires à l'init du module
import('@/verticals/restaurant/ui').then(m => VerticalUIRegistry.register('restaurant', m.RestaurantUIPlugin));
import('@/verticals/hotel/ui').then(m => VerticalUIRegistry.register('hotel', m.HotelUIPlugin));
import('@/verticals/bakery/ui').then(m => VerticalUIRegistry.register('bakery', m.BakeryUIPlugin));
import('@/verticals/salon/ui').then(m => VerticalUIRegistry.register('salon', m.SalonUIPlugin));
import('@/verticals/clinic/ui').then(m => VerticalUIRegistry.register('clinic', m.ClinicUIPlugin));
import('@/verticals/garage/ui').then(m => VerticalUIRegistry.register('garage', m.GarageUIPlugin));
import('@/verticals/retail/ui').then(m => VerticalUIRegistry.register('retail', m.RetailUIPlugin));
import('@/verticals/custom/ui').then(m => VerticalUIRegistry.register('custom', m.CustomUIPlugin));
