import { registerCustomerProfileInitHandler } from '../handlers/CustomerProfileInitHandler';
import { registerVipStatusEvaluationHandler } from '../handlers/VipStatusEvaluationHandler';
import { registerCustomerRiskTagHandler } from '../handlers/CustomerRiskTagHandler';
import { registerLoyaltyPointsAccrualHandler } from '../handlers/LoyaltyPointsAccrualHandler';
import { registerLoyaltyRewardAlertHandler } from '../handlers/LoyaltyRewardAlertHandler';
import { registerBirthdayCampaignHandler } from '../handlers/BirthdayCampaignHandler';
import { registerSegmentTargetingHandler } from '../handlers/SegmentTargetingHandler';

export function registerCrmHandlers(): Array<() => void> {
  return [
    registerCustomerProfileInitHandler(),
    registerVipStatusEvaluationHandler(),
    registerCustomerRiskTagHandler(),
    registerLoyaltyPointsAccrualHandler(),
    registerLoyaltyRewardAlertHandler(),
    registerBirthdayCampaignHandler(),
    registerSegmentTargetingHandler(),
  ];
}
