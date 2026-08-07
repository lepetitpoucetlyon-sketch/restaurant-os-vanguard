import type { PlatformVariant } from '@/domain/schemas/tenant';
import type { BrandConfig } from '../brand';

export { restaurantDefaultTokens, restaurantVerticalTokens } from './restaurant';
export { hotelDefaultTokens, hotelVerticalTokens }          from './hotel';
export { bakeryDefaultTokens, bakeryVerticalTokens }        from './bakery';
export { salonDefaultTokens, salonVerticalTokens }          from './salon';
export { clinicDefaultTokens, clinicVerticalTokens }        from './clinic';
export { garageDefaultTokens, garageVerticalTokens }        from './garage';
export { retailDefaultTokens, retailVerticalTokens }        from './retail';
export { customDefaultTokens, customVerticalTokens }        from './custom';

import { restaurantDefaultTokens, restaurantVerticalTokens } from './restaurant';
import { hotelDefaultTokens, hotelVerticalTokens }          from './hotel';
import { bakeryDefaultTokens, bakeryVerticalTokens }        from './bakery';
import { salonDefaultTokens, salonVerticalTokens }          from './salon';
import { clinicDefaultTokens, clinicVerticalTokens }        from './clinic';
import { garageDefaultTokens, garageVerticalTokens }        from './garage';
import { retailDefaultTokens, retailVerticalTokens }        from './retail';
import { customDefaultTokens, customVerticalTokens }        from './custom';

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
