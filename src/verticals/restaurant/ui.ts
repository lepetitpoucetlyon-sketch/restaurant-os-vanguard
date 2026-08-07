import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * RestaurantUIPlugin
 * Utilise tous les composants partagés — pas d'overrides.
 * Theming géré par VERTICAL_DEFAULT_TOKENS (restaurantDefaultTokens).
 */
export const RestaurantUIPlugin: IVerticalUIPlugin = {
  variant:         'restaurant',
  preferredLayout: 'sidebar',
  // Scoped tokens : coins nets sur le POS (fluidité tactile)
  scopedTokens: {
    '/pos': { '--radius-card': '1rem', '--radius-btn': '0.75rem' },
    '/kds': { '--radius-card': '0.5rem' },
  },
};
