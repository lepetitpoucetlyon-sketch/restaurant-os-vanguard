export interface COMMERCEEvents {
  "crm.birthday_approaching": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    birthdayAt: string;
    daysUntil: number;
  };

  "commerce.promotion_activated": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    promotionId: string;
    discountBps: number;
    productIds: string[];
  };

  "commerce.promotion_expired": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    promotionId: string;
  };

  "commerce.reservation_reconfirmed": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerPhone: string;
    date: string;
    time: string;
  };

  "commerce.reservation_cancelled": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reservationId: string;
    customerPhone: string;
    date: string;
    time: string;
    covers?: number;
  };

  "commerce.reservation_deposit_paid": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    depositId: string;
    amountInMicrounits: number;
    reservationId?: string;
    customerId?: string;
    paidAt: number;
  };

  "commerce.waitlist_ready": {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    waitlistEntryId: string;
    guestName: string;
    guestPhone?: string;
    partySize: number;
    estimatedWaitMinutes?: number;
  };

  'commerce.yield_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    config: Record<string, unknown>;
  };

  'commerce.margin_warning': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    productId: string;
    currentMarginBps: number;
    thresholdBps: number;
    triggerEventId: string;
  };

  'crm.customer_created': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    email?: string;
    phone?: string;
    source: string;
  };

  'crm.customer_updated': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    updates: Record<string, unknown>;
  };

  'crm.points_earned': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    points: number;
    sourceOrderId: string;
  };

  'crm.reward_redeemed': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    rewardId: string;
    pointsCost: number;
  };

  'crm.reward_unlocked': {
    v: 1;
    tenantId: string;
    customerId: string;
    rewardId: string;
    rewardName: string;
  };

  'crm.segment_matched': {
    v: 1;
    tenantId: string;
    customerId: string;
    segmentId: string;
    segmentName: string;
  };

  'marketing.campaign_launched': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    campaignId: string;
    targetSegment: string;
    launchedBy: string;
  };

  'inactive.90d': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    customerId: string;
    lastVisitDate: string;
    totalSpentInMicrounits: number;
  };

  'review.negative': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reviewId: string;
    customerId: string;
    rating: number;
    platform: string;
    content: string;
  };

  'review.positive': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    reviewId: string;
    customerId: string;
    rating: number;
    platform: string;
    content: string;
  };

  'quote.sent': {
    v: 1;
    isSimulation?: boolean;
    tenantId: string;
    quoteId: string;
    customerId: string;
    totalInMicrounits: number;
    sentAt: string;
  };

  'crm.rfm_trigger': { tenantId: string; customerId: string };

  'commerce.review_bombing_detected': { v:1; tenantId: string; burstCount: number; avgRating: number; noTextRatio: number; windowHours: number; detectedAt: number };

  'crm.no_show_penalized': { v:1; tenantId: string; reservationId: string; customerId: string; penaltyAmountInMicrounits: number; chargedAt: number };

  'crm.guest_allergen_alerted': { v:1; tenantId: string; customerId: string; orderId: string; conflictingAllergens: string[]; alertedAt: number };

  'crm.review_request_dispatched': { v:1; tenantId: string; orderId: string; customerPhone: string; channel: 'sms' | 'whatsapp'; dispatchedAt: number };

  'crm.cross_loyalty_points_transacted': { v:1; tenantId: string; customerId: string; pointsDelta: number; newBalance: number; transactedAt: number };

  'crm.turnover_optimized': { v:1; tenantId: string; tableNumber: string; predictedDurationMinutes: number; secondSeatingAvailable: boolean; optimizedAt: number };

  'crm.special_event_deposit_secured': { v:1; tenantId: string; contractId: string; depositAmountInMicrounits: number; eventDateIso: string; securedAt: number };

  'crm.private_dining_contract_signed': { v:1; tenantId: string; contractId: string; customerName: string; totalQuoteInMicrounits: number; signedAt: number };

  'commerce.dynamic_surge_applied': { v:1; tenantId: string; surgeMultiplier: number; reason: 'high_demand_match_night' | 'rush_hour'; appliedAt: number };

  'commerce.sommelier_pairing_suggested': { v:1; tenantId: string; orderId: string; dishSku: string; recommendedWineSku: string; suggestedAt: number };

  'crm.vip_preference_applied': { v:1; tenantId: string; customerId: string; preferenceSummary: string; appliedAt: number };

  'crm.lost_found_registered': { v:1; tenantId: string; itemId: string; itemDescription: string; locationFound: string; registeredAt: number };

  'crm.influencer_collab_tracked': { v:1; tenantId: string; influencerHandle: string; promoCode: string; generatedRevenueInMicrounits: number; trackedAt: number };

  'crm.digital_coat_check_issued': { v:1; tenantId: string; tagNumber: string; customerPhone: string; issuedAt: number };

  'crm.valet_parking_ticket_created': { v:1; tenantId: string; ticketId: string; vehiclePlate: string; spotNumber: string; createdAt: number };
}
