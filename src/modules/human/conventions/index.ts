import type { PlatformVariant } from '@/domain/schemas/tenant';
import type { ICollectiveAgreement } from './types';
import { HCR_CONVENTION } from './hcr.convention';
import { AUTO_CONVENTION } from './auto.convention';

export * from './types';
export * from './hcr.convention';
export * from './auto.convention';

export function resolveCollectiveAgreement(variant?: PlatformVariant): ICollectiveAgreement {
  switch (variant) {
    case 'garage':
      return AUTO_CONVENTION;
    case 'restaurant':
    case 'hotel':
    case 'bakery':
    default:
      return HCR_CONVENTION;
  }
}
