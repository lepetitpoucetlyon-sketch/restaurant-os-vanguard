import { registerCRMVipHandler } from '@/modules/commerce';
import { registerCustomerRFMAnalyzerHandler } from '../handlers/CustomerRFMAnalyzerHandler';
import { registerLoyaltyEngineHandler } from '../handlers/LoyaltyEngineHandler';
import { registerMarketingCampaignRouterHandler } from '../handlers/MarketingCampaignRouterHandler';
import { registerPrivacyConsentHandler } from '../handlers/PrivacyConsentHandler';
import { registerNoShowCRMHandler } from '../handlers/NoShowCRMHandler';
import { registerInactiveCustomerHandler } from '../handlers/InactiveCustomerHandler';
import { registerNegativeReviewHandler } from '../handlers/NegativeReviewHandler';
import { BirthdayOfferHandler } from '../handlers/BirthdayOfferHandler';
import { PromotionPriceHandler } from '../handlers/PromotionPriceHandler';
import { PromotionExpiryHandler } from '../handlers/PromotionExpiryHandler';
import { registerWaitlistReadyHandler } from '../handlers/WaitlistReadyHandler';

export function registerCommerceHandlers(): Array<() => void> {
  return [
    registerCRMVipHandler(),
    registerCustomerRFMAnalyzerHandler(),
    registerLoyaltyEngineHandler(),
    registerMarketingCampaignRouterHandler(),
    registerPrivacyConsentHandler(),
    registerNoShowCRMHandler(),
    registerInactiveCustomerHandler(),
    registerNegativeReviewHandler(),
    BirthdayOfferHandler.register(),
    PromotionPriceHandler.register(),
    PromotionExpiryHandler.register(),
    registerWaitlistReadyHandler(),
  ];
}
