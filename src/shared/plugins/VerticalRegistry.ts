import { logger } from '@/lib/logger';
import type { IVerticalPlugin } from './IVerticalPlugin';
import type { PlatformVariant } from '@/modules/system';

type VerticalFactory = () => IVerticalPlugin;

const registry = new Map<PlatformVariant, VerticalFactory>();

export const VerticalRegistry = {
  register(variant: PlatformVariant, factory: VerticalFactory): void {
    registry.set(variant, factory);
    logger.info(`[VerticalRegistry] registered: ${variant}`);
  },

  /**
   * Résout le plugin d'une verticale.
   *
   * Fallback universel : si la verticale n'est pas encore enregistrée
   * (nouvelle verticale en cours de développement), on utilise `custom`
   * au lieu de planter le provisioning — le branding et toute
   * l'infrastructure tenant fonctionnent normalement grâce au fallback.
   *
   * Règle pour ajouter une nouvelle verticale :
   *  1. Ajouter dans PLATFORM_VARIANTS + VERTICAL_META (tenant.ts)
   *  2. Créer src/verticals/<nom>/<Nom>Vertical.ts + index.ts
   *  3. register() ici — en attendant, le fallback 'custom' prend le relai.
   */
  resolve(variant: PlatformVariant): IVerticalPlugin {
    const factory = registry.get(variant) ?? registry.get('custom');
    if (!factory) throw new Error(`[VerticalRegistry] No vertical registered for variant: ${variant}`);
    if (!registry.has(variant)) {
      logger.warn(`[VerticalRegistry] Variant "${variant}" non enregistré — fallback sur "custom". Branding OK.`);
    }
    return factory();
  },

  list(): PlatformVariant[] {
    return Array.from(registry.keys());
  },
};

// Auto-registration — lazy imports avoid circular deps at module init
import('@/verticals/restaurant').then(m => VerticalRegistry.register('restaurant', () => new m.RestaurantVertical()));
import('@/verticals/hotel').then(m => VerticalRegistry.register('hotel', () => new m.HotelVertical()));
import('@/verticals/garage').then(m => VerticalRegistry.register('garage', () => new m.AutoVertical()));
import('@/verticals/clinic').then(m => VerticalRegistry.register('clinic', () => new m.HealthVertical()));
import('@/verticals/bakery').then(m => VerticalRegistry.register('bakery', () => new m.BakeryVertical()));
import('@/verticals/salon').then(m => VerticalRegistry.register('salon', () => new m.SalonVertical()));
import('@/verticals/retail').then(m => VerticalRegistry.register('retail', () => new m.RetailVertical()));
import('@/verticals/custom').then(m => VerticalRegistry.register('custom', () => new m.CustomVertical()));
