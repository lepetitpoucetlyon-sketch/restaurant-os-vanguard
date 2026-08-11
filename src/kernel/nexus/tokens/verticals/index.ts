import type { PlatformVariant } from '@nexus/contracts';
import type { BrandConfig } from '../brand';

export { restaurantDefaultTokens, restaurantVerticalTokens, restaurantDefaultAppearance } from './restaurant';
export { hotelDefaultTokens, hotelVerticalTokens, hotelDefaultAppearance }          from './hotel';
export { bakeryDefaultTokens, bakeryVerticalTokens, bakeryDefaultAppearance }        from './bakery';
export { salonDefaultTokens, salonVerticalTokens, salonDefaultAppearance }          from './salon';
export { clinicDefaultTokens, clinicVerticalTokens, clinicDefaultAppearance }        from './clinic';
export { garageDefaultTokens, garageVerticalTokens, garageDefaultAppearance }        from './garage';
export { retailDefaultTokens, retailVerticalTokens, retailDefaultAppearance }        from './retail';
export { customDefaultTokens, customVerticalTokens, customDefaultAppearance }        from './custom';

import { restaurantDefaultTokens, restaurantVerticalTokens, restaurantDefaultAppearance } from './restaurant';
import { hotelDefaultTokens, hotelVerticalTokens, hotelDefaultAppearance }          from './hotel';
import { bakeryDefaultTokens, bakeryVerticalTokens, bakeryDefaultAppearance }        from './bakery';
import { salonDefaultTokens, salonVerticalTokens, salonDefaultAppearance }          from './salon';
import { clinicDefaultTokens, clinicVerticalTokens, clinicDefaultAppearance }        from './clinic';
import { garageDefaultTokens, garageVerticalTokens, garageDefaultAppearance }        from './garage';
import { retailDefaultTokens, retailVerticalTokens, retailDefaultAppearance }        from './retail';
import { customDefaultTokens, customVerticalTokens, customDefaultAppearance }        from './custom';

export const VERTICAL_DEFAULT_TOKENS: Record<PlatformVariant, Partial<BrandConfig>> = {
  restaurant: restaurantDefaultTokens,
  hotel:      hotelDefaultTokens,
  bakery:     bakeryDefaultTokens,
  salon:      salonDefaultTokens,
  clinic:     clinicDefaultTokens,
  garage:     garageDefaultTokens,
  retail:     retailDefaultTokens,
  custom:     customDefaultTokens,
};

/** Appearance par défaut de chaque vertical — appliquée au premier chargement si aucune préférence tenant n'est stockée. */
export const VERTICAL_APPEARANCE: Record<PlatformVariant, 'light' | 'dark' | 'auto'> = {
  restaurant: restaurantDefaultAppearance,
  hotel:      hotelDefaultAppearance,
  bakery:     bakeryDefaultAppearance,
  salon:      salonDefaultAppearance,
  clinic:     clinicDefaultAppearance,
  garage:     garageDefaultAppearance,
  retail:     retailDefaultAppearance,
  custom:     customDefaultAppearance,
};

export const VERTICAL_EXTRA_TOKENS: Record<PlatformVariant, Record<string, string>> = {
  restaurant: restaurantVerticalTokens,
  hotel:      hotelVerticalTokens,
  bakery:     bakeryVerticalTokens,
  salon:      salonVerticalTokens,
  clinic:     clinicVerticalTokens,
  garage:     garageVerticalTokens,
  retail:     retailVerticalTokens,
  custom:     customVerticalTokens,
};
