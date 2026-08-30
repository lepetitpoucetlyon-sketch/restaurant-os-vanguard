'use client';

import { useMemo } from 'react';
import { useTenant } from '@/shared/providers/NexusCoreProvider';
import {
  IVerticalLexicon,
  DEFAULT_RESTAURANT_LEXICON,
  GARAGE_LEXICON,
  SALON_LEXICON,
  CLINIC_LEXICON,
  HOTEL_LEXICON,
  BAKERY_LEXICON,
  RETAIL_LEXICON,
  GYM_LEXICON,
  COWORKING_LEXICON,
  VETERINARY_LEXICON,
  FLORIST_LEXICON,
  CUSTOM_LEXICON,
} from '../plugins/IVerticalLexicon';

export function useLexicon(): IVerticalLexicon {
  const tenantState = useTenant();
  const variant = tenantState?.activeTenantConfig?.variant ?? tenantState?.activeTenantConfig?.platformVariant ?? 'restaurant';

  return useMemo(() => {
    switch (variant) {
      case 'garage':
        return GARAGE_LEXICON;
      case 'salon':
        return SALON_LEXICON;
      case 'clinic':
        return CLINIC_LEXICON;
      case 'hotel':
        return HOTEL_LEXICON;
      case 'bakery':
        return BAKERY_LEXICON;
      case 'retail':
        return RETAIL_LEXICON;
      case 'gym':
        return GYM_LEXICON;
      case 'coworking':
        return COWORKING_LEXICON;
      case 'veterinary':
        return VETERINARY_LEXICON;
      case 'florist':
        return FLORIST_LEXICON;
      case 'custom':
        return CUSTOM_LEXICON;
      case 'restaurant':
      default:
        return DEFAULT_RESTAURANT_LEXICON;
    }
  }, [variant]);
}

