export interface DELIVERYEvents {
  'delivery.delivered': {
    v: 1;
    tenantId: string;
    deliveryId: string;
    orderId: string;
    driverId?: string;
  };

  'delivery.order_normalized': { v:1; tenantId: string; platform: 'uber_eats' | 'deliveroo' | 'just_eat'; platformOrderId: string; posOrderId: string; totalInMicrounits: number; normalizedAt: number };

  'delivery.commission_pnl_calculated': { v:1; tenantId: string; platform: string; platformOrderId: string; grossTtcInMicrounits: number; commissionInMicrounits: number; netMerchantInMicrounits: number; calculatedAt: number };

  'delivery.store_paused': { v:1; tenantId: string; platform: string; reason: 'kitchen_rush' | 'understaffed' | 'manual'; autoResumeAt?: number; pausedAt: number };

  'delivery.courier_pacing_triggered': { v:1; tenantId: string; orderId: string; courierDistanceMeters: number; etaMinutes: number; fireKitchenPrep: boolean; triggeredAt: number };

  'delivery.bag_pin_released': { v:1; tenantId: string; orderId: string; courierPin: string; releasedToCourier: boolean; releasedAt: number };

  'delivery.dual_pricing_applied': { v:1; tenantId: string; productId: string; diningRoomPriceInMicrounits: number; deliveryPriceInMicrounits: number; markupPct: number; appliedAt: number };

  'delivery.thermal_packaging_costed': { v:1; tenantId: string; orderId: string; packagingCostInMicrounits: number; itemCategoryCount: number; costedAt: number };

  'delivery.in_transit_cancelled': { v:1; tenantId: string; platformOrderId: string; platform: string; foodLostCostInMicrounits: number; refundClaimSubmitted: boolean; cancelledAt: number };

  'delivery.address_scored': { v:1; tenantId: string; destinationAddress: string; reliabilityScore: number; isAccessible: boolean; scoredAt: number };

  'delivery.cold_dispute_proof_sealed': { v:1; tenantId: string; orderId: string; handoverTempCelsius: number; photoEvidenceHash: string; sealedAt: number };
}
