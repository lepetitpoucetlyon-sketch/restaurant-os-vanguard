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
} from '../plugins/IVerticalLexicon';

export function useLexicon(): IVerticalLexicon {
  const tenantState = useTenant();
  const variant = tenantState?.activeTenantConfig?.platformVariant ?? 'restaurant';

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
      case 'restaurant':
      case 'bakery':
      default:
        return DEFAULT_RESTAURANT_LEXICON;
    }
  }, [variant]);
}
