/**
 * L70 — Routage BIN (Bank Identification Number) paiement CB.
 *
 * Le BIN (6-8 premiers chiffres d'une carte) identifie :
 *   - Le réseau (Visa, Mastercard, Amex, CB…)
 *   - Le type de carte (débit, crédit, corporate, prépayée)
 *   - La banque émettrice
 *
 * Sans routage BIN, un terminal peut accepter des cartes Amex Corporate
 * (commission 2,8% vs 0,3% CB) ou des cartes non-EMV sans le détecter.
 * Ce service valide le BIN avant le débit et route vers le bon acquéreur.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L70.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'cb' | 'unknown';
export type CardType = 'debit' | 'credit' | 'corporate' | 'prepaid' | 'unknown';

export interface BINInfo {
  bin: string;
  network: CardNetwork;
  cardType: CardType;
  issuerCountry: string;
  isEMV: boolean;
  estimatedFeeRatePct: number;
}

export interface BINRoutingDecision {
  bin: string;
  allowed: boolean;
  acquirer: string;
  estimatedFeeRatePct: number;
  reason?: string;
  network: CardNetwork;
  cardType: CardType;
}

const NETWORK_PREFIXES: Array<{ prefix: string; network: CardNetwork }> = [
  { prefix: '4', network: 'visa' },
  { prefix: '5', network: 'mastercard' },
  { prefix: '2', network: 'mastercard' },
  { prefix: '34', network: 'amex' },
  { prefix: '37', network: 'amex' },
  { prefix: '6', network: 'cb' },
];

export class BINRoutingService {
  static detectNetwork(pan: string): CardNetwork {
    const bin = pan.slice(0, 8);
    for (const { prefix, network } of NETWORK_PREFIXES.sort((a, b) => b.prefix.length - a.prefix.length)) {
      if (bin.startsWith(prefix)) return network;
    }
    return 'unknown';
  }

  static async lookupBIN(bin: string): Promise<BINInfo | null> {
    return Nexus.adapter.get<BINInfo>(`mcc/bin_registry/${bin.slice(0, 6)}`);
  }

  static async route(input: {
    tenantId: string;
    panMasked: string;
    bin: string;
    allowedNetworks?: CardNetwork[];
    preferredAcquirer?: string;
  }): Promise<BINRoutingDecision> {
    const network = this.detectNetwork(input.bin);
    const allowedNetworks = input.allowedNetworks ?? ['visa', 'mastercard', 'cb', 'amex'];
    const binInfo = await this.lookupBIN(input.bin);

    if (!allowedNetworks.includes(network)) {
      return {
        bin: input.bin,
        allowed: false,
        acquirer: '',
        estimatedFeeRatePct: 0,
        reason: `network_not_accepted:${network}`,
        network,
        cardType: binInfo?.cardType ?? 'unknown',
      };
    }

    const acquirer = input.preferredAcquirer ?? (network === 'amex' ? 'amex_direct' : 'stripe');
    const estimatedFeeRatePct = binInfo?.estimatedFeeRatePct ?? (network === 'amex' ? 2.8 : 0.3);

    return {
      bin: input.bin,
      allowed: true,
      acquirer,
      estimatedFeeRatePct,
      network,
      cardType: binInfo?.cardType ?? 'unknown',
    };
  }
}
