import type { PlatformVariant } from '@/modules/system';
import type { BrandConfig } from '../brand';

export { restaurantDefaultTokens, restaurantVerticalTokens, restaurantDefaultAppearance } from './restaurant';
export { hotelDefaultTokens, hotelVerticalTokens, hotelDefaultAppearance }          from './hotel';
export { bakeryDefaultTokens, bakeryVerticalTokens, bakeryDefaultAppearance }        from './bakery';
export { salonDefaultTokens, salonVerticalTokens, salonDefaultAppearance }          from './salon';
export { clinicDefaultTokens, clinicVerticalTokens, clinicDefaultAppearance }        from './clinic';
export { garageDefaultTokens, garageVerticalTokens, garageDefaultAppearance }        from './garage';
export { retailDefaultTokens, retailVerticalTokens, retailDefaultAppearance }        from './retail';
export { customDefaultTokens, customVerticalTokens, customDefaultAppearance }        from './custom';
export { gymDefaultTokens, gymVerticalTokens, gymDefaultAppearance }                 from './gym';
export { coworkingDefaultTokens, coworkingVerticalTokens, coworkingDefaultAppearance } from './coworking';
export { veterinaryDefaultTokens, veterinaryVerticalTokens, veterinaryDefaultAppearance } from './veterinary';
export { floristDefaultTokens, floristVerticalTokens, floristDefaultAppearance }     from './florist';

import { restaurantDefaultTokens, restaurantVerticalTokens, restaurantDefaultAppearance } from './restaurant';
import { hotelDefaultTokens, hotelVerticalTokens, hotelDefaultAppearance }          from './hotel';
import { bakeryDefaultTokens, bakeryVerticalTokens, bakeryDefaultAppearance }        from './bakery';
import { salonDefaultTokens, salonVerticalTokens, salonDefaultAppearance }          from './salon';
import { clinicDefaultTokens, clinicVerticalTokens, clinicDefaultAppearance }        from './clinic';
import { garageDefaultTokens, garageVerticalTokens, garageDefaultAppearance }        from './garage';
import { retailDefaultTokens, retailVerticalTokens, retailDefaultAppearance }        from './retail';
import { customDefaultTokens, customVerticalTokens, customDefaultAppearance }        from './custom';
import { gymDefaultTokens, gymVerticalTokens, gymDefaultAppearance }                 from './gym';
import { coworkingDefaultTokens, coworkingVerticalTokens, coworkingDefaultAppearance } from './coworking';
import { veterinaryDefaultTokens, veterinaryVerticalTokens, veterinaryDefaultAppearance } from './veterinary';
import { floristDefaultTokens, floristVerticalTokens, floristDefaultAppearance }     from './florist';

export const VERTICAL_DEFAULT_TOKENS: Record<PlatformVariant, Partial<BrandConfig>> = {
  restaurant: restaurantDefaultTokens,
  hotel:      hotelDefaultTokens,
  bakery:     bakeryDefaultTokens,
  salon:      salonDefaultTokens,
  clinic:     clinicDefaultTokens,
  garage:     garageDefaultTokens,
  retail:     retailDefaultTokens,
  custom:     customDefaultTokens,
  gym:        gymDefaultTokens,
  coworking:  coworkingDefaultTokens,
  veterinary: veterinaryDefaultTokens,
  florist:    floristDefaultTokens,
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
  gym:        gymDefaultAppearance,
  coworking:  coworkingDefaultAppearance,
  veterinary: veterinaryDefaultAppearance,
  florist:    floristDefaultAppearance,
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
  gym:        gymVerticalTokens,
  coworking:  coworkingVerticalTokens,
  veterinary: veterinaryVerticalTokens,
  florist:    floristVerticalTokens,
};
