/**
 * 💰 Pricing Configuration — Single Source of Truth
 * All SaaS tiers defined here. Change once, update everywhere.
 */

export const PRICING = {
  STANDARD: {
    name: 'Standard',
    monthlyEur: 79,
    yearlyEur: 79 * 12 * 0.9, // 10% annual discount
    stripeProductId: process.env.STRIPE_PRODUCT_STANDARD ?? '',
    stripePriceId: process.env.STRIPE_PRICE_STANDARD ?? '',
    features: ['POS', 'Inventory', 'Basic Analytics', 'NF525 Compliance'],
  },
  PREMIUM: {
    name: 'Premium',
    monthlyEur: 149,
    yearlyEur: 149 * 12 * 0.9,
    stripeProductId: process.env.STRIPE_PRODUCT_PREMIUM ?? '',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM ?? '',
    features: ['POS', 'Inventory', 'Advanced Analytics', 'NF525', 'AI Recommendations', 'Priority Support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyEur: 299,
    yearlyEur: 299 * 12 * 0.9,
    stripeProductId: process.env.STRIPE_PRODUCT_ENTERPRISE ?? '',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    features: ['Everything in Premium', 'Custom Integrations', 'Dedicated Account Manager', 'SLA 99.9%'],
  },
} as const;

export type PricingTier = keyof typeof PRICING;

/**
 * Helper: Get price for a tier
 */
export function getPriceEur(tier: PricingTier, annual = false): number {
  const tierData = PRICING[tier];
  return annual ? tierData.yearlyEur : tierData.monthlyEur;
}

/**
 * Helper: Get Stripe price ID
 */
export function getStripePriceId(tier: PricingTier): string {
  return PRICING[tier].stripePriceId;
}

/**
 * Helper: Get all tiers for display
 */
export function getAllTiers() {
  return Object.entries(PRICING).map(([key, data]) => ({
    tier: key as PricingTier,
    ...data,
  }));
}
