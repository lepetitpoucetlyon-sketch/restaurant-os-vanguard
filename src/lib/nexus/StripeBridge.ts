/**
 * 🛰️ STRIPE BRIDGE - Sovereign Economy Engine
 * Grade VIII - Pure Headless Billing.
 * Source of Truth (La Loi de l'Empire) pour les prix.
 */

// 1. LA LOI DE L'EMPIRE (Prix en dur côté Suzerain)
export const SOVEREIGN_PRICING = {
  currency: 'EUR',
  core_engine: 49.00,
  capabilities: {
    'mod_hygiene': 20.00,
    'mod_planning': 50.00,
    'mod_fleet_management': 150.00,
    'mod_kiosk': 30.00
  }
} as const;

import { logger } from '@/lib/logger';

export type CapabilityId = keyof typeof SOVEREIGN_PRICING.capabilities;

/**
 * Calcule le MRR dynamique d'une instance en fonction du génome
 */
export const calculateEngineMRR = (
  basePrice: number,
  activeCapabilities: string[],
  multiplier: number = 1.0
): number => {
  const capabilitiesCost = activeCapabilities.reduce((total, capId) => {
    return total + (SOVEREIGN_PRICING.capabilities[capId as CapabilityId] || 0);
  }, 0);

  return (basePrice + capabilitiesCost) * multiplier;
};

/**
 * 2. PORTAIL EXTERNE STRIPE (Agnostic Redirection)
 * Redirige le vassal vers Stripe pour la gestion d'abonnement.
 */
export const redirectToStripePortal = async (tenantId: string, _returnUrl: string) => {
  // Dans un cas d'usage réel, ici on appellerait l'API MCC pour obtenir la Stripe Session URL.
  const STRIPE_PORTAL_MOCK_URL = `https://billing.stripe.com/p/session/mock_${tenantId}`;
  
  logger.info(`[Empire Economy] Redirecting Node ${tenantId} to Sovereign Portal...`);
  window.location.href = STRIPE_PORTAL_MOCK_URL;
};
