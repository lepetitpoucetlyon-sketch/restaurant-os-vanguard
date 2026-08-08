import type { PlatformVariant } from '@/domain/schemas/tenant';
import type { ICollectiveAgreement } from './types';
import { HCR_CONVENTION } from './hcr.convention';
import { AUTO_CONVENTION } from './auto.convention';
import { SALON_CONVENTION } from './salon.convention';
import { CLINIC_CONVENTION } from './clinic.convention';
import { RETAIL_CONVENTION } from './retail.convention';

export * from './types';
export * from './hcr.convention';
export * from './auto.convention';
export * from './salon.convention';
export * from './clinic.convention';
export * from './retail.convention';

export function resolveCollectiveAgreement(variant?: PlatformVariant): ICollectiveAgreement {
  switch (variant) {
    case 'garage':
      return AUTO_CONVENTION;
    case 'salon':
      return SALON_CONVENTION;
    case 'clinic':
      return CLINIC_CONVENTION;
    case 'retail':
      return RETAIL_CONVENTION;
    case 'restaurant':
    case 'hotel':
    case 'bakery':
      return HCR_CONVENTION;
    default:
      if (!variant) return HCR_CONVENTION;
      throw new Error(`No collective agreement defined for variant: ${variant}`);
  }
}
