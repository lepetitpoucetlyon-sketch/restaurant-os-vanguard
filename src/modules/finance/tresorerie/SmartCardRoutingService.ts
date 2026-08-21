export type CardNetworkType = 'cb_standard' | 'conecs_meal_voucher' | 'visa_mastercard_intl' | 'amex';

export interface CardRoutingDecision {
  bin: string;
  network: CardNetworkType;
  recommendedTpeRoute: 'conecs_direct' | 'cb_domestic' | 'international_gateway';
  interchangeRateBps: number; // ex: 20 bps = 0.20% (CB), 380 bps = 3.8% (Amex US)
  isDoubleCommissionPrevented: boolean;
  savingsEstimatedInMicrounits: number;
}

/**
 * Known CONECS BIN prefixes in France (Edenred, Sodexo/Pluxee, Swile, Bimpli, Glady).
 */
const CONECS_BINS = ['535522', '535523', '535524', '516793', '521360', '522436', '534228'];

/**
 * SmartCardRoutingService — Angle mort L27.
 * Détecte les cartes titres-restaurants (CONECS) à la volée pour router vers le canal CONECS direct et éviter la commission double CB standard.
 */
export class SmartCardRoutingService {
  static routeCardPayment(bin: string, amountInMicrounits: number): CardRoutingDecision {
    const cleanBin = bin.replace(/\s/g, '').substring(0, 6);

    // 1. Check CONECS meal vouchers
    if (CONECS_BINS.some(c => cleanBin.startsWith(c))) {
      // CONECS fee ~0.8% vs CB (0.4%) + TR fee (1.2%) if mistakenly routed as CB
      const avoidedCommissionInMicrounits = Math.round((amountInMicrounits * 0.008));
      return {
        bin: cleanBin,
        network: 'conecs_meal_voucher',
        recommendedTpeRoute: 'conecs_direct',
        interchangeRateBps: 80,
        isDoubleCommissionPrevented: true,
        savingsEstimatedInMicrounits: avoidedCommissionInMicrounits,
      };
    }

    // 2. Check Amex
    if (cleanBin.startsWith('34') || cleanBin.startsWith('37')) {
      return {
        bin: cleanBin,
        network: 'amex',
        recommendedTpeRoute: 'international_gateway',
        interchangeRateBps: 290,
        isDoubleCommissionPrevented: false,
        savingsEstimatedInMicrounits: 0,
      };
    }

    // 3. Domestic CB / EU Visa / MC
    return {
      bin: cleanBin,
      network: 'cb_standard',
      recommendedTpeRoute: 'cb_domestic',
      interchangeRateBps: 25,
      isDoubleCommissionPrevented: false,
      savingsEstimatedInMicrounits: 0,
    };
  }
}
