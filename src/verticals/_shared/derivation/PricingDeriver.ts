/**
 * 💰 PricingDeriver — dérive la grille tarifaire SaaS suggérée à MCC (§C.10 P2d).
 *
 * SORTIE CÔTÉ MCC uniquement — pas visible du tenant. Sert au commercial pour
 * proposer un tarif calibré au tenant onboardé, en fonction de son volume attendu,
 * de ses capabilities et de son tier.
 *
 * Modèle : base tier + add-ons capabilities + volume-based (nb sites × nb postes).
 */

import type { CapabilitySet, CapabilityKey } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '@/modules/commerce';
import type { PrecisionTier } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface SuggestedTier {
    readonly name: string;
    readonly basePriceMonthEur: number;
    readonly includedSites: number;
    readonly includedPosStations: number;
    readonly rationale: string;
}

export interface AddonPricing {
    readonly capability: CapabilityKey;
    readonly priceMonthEur: number;
    readonly rationale: string;
}

export interface DerivedPricing {
    readonly suggestedTier: SuggestedTier;
    readonly addons: readonly AddonPricing[];
    readonly totalEstimatedMonthEur: number;
    readonly annualDiscount: number;   // %
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface PricingDeriverInput {
    readonly answers: QualificationAnswers;
    readonly tier: PrecisionTier;
    readonly effectiveCapabilities: CapabilitySet;
    readonly siteCount?: number;
    readonly posStations?: number;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

export function derivePricing(input: PricingDeriverInput): DerivedPricing {
    const { tier, effectiveCapabilities: caps, siteCount = 1, posStations = 1 } = input;
    const derivedFrom: Record<string, string> = {};

    // ── Tier suggéré (grille de base MCC) ─────────────────────────────────
    const suggestedTier = derivedTierSuggested(tier, siteCount, posStations);
    derivedFrom['suggestedTier'] = `tier=${tier}, siteCount=${siteCount}, posStations=${posStations}`;

    // ── Add-ons capabilities premium ──────────────────────────────────────
    const addons: AddonPricing[] = [];
    if (caps['mod_ai'] || caps['mod_oracle']) {
        addons.push({
            capability: 'mod_ai',
            priceMonthEur: 49,
            rationale: 'Assistant IA (Gemini) — coût variable selon usage LLM',
        });
    }
    if (caps['mod_haccp']) {
        addons.push({
            capability: 'mod_haccp',
            priceMonthEur: 29,
            rationale: 'HACCP + sondes IoT + alertes 24/7',
        });
    }
    if (caps['mod_kds']) {
        addons.push({
            capability: 'mod_kds',
            priceMonthEur: 15 * (siteCount),
            rationale: `KDS × ${siteCount} sites`,
        });
    }
    if (caps['mod_fleet_management']) {
        addons.push({
            capability: 'mod_fleet_management',
            priceMonthEur: 79,
            rationale: 'MCC supervision multi-établissements',
        });
    }
    if (caps['mod_marketing']) {
        addons.push({
            capability: 'mod_marketing',
            priceMonthEur: 39,
            rationale: 'Campagnes marketing + templates + segmentation',
        });
    }
    if (caps['mod_crm']) {
        addons.push({
            capability: 'mod_crm',
            priceMonthEur: 29,
            rationale: 'CRM avec segmentation RFM',
        });
    }
    derivedFrom['addons'] = `${addons.length} add-ons capabilities activés`;

    // ── Total mensuel ─────────────────────────────────────────────────────
    const addonSum = addons.reduce((sum, a) => sum + a.priceMonthEur, 0);
    const totalEstimatedMonthEur = suggestedTier.basePriceMonthEur + addonSum;

    // ── Remise annuelle (2 mois offerts) ──────────────────────────────────
    const annualDiscount = 16.67;  // ≈ 2/12
    derivedFrom['annualDiscount'] = 'engagement annuel → 2 mois offerts';

    return { suggestedTier, addons, totalEstimatedMonthEur, annualDiscount, derivedFrom };
}

function derivedTierSuggested(tier: PrecisionTier, siteCount: number, posStations: number): SuggestedTier {
    switch (tier) {
        case 'L0':
            return {
                name: 'Starter (Artisan)',
                basePriceMonthEur: 29,
                includedSites: 1,
                includedPosStations: 1,
                rationale: 'Tier L0 solo / auto-entrepreneur — interface épurée, 1 poste',
            };
        case 'L1':
            return {
                name: 'Pro (TPE)',
                basePriceMonthEur: 59 + Math.max(0, posStations - 2) * 15,
                includedSites: 1,
                includedPosStations: 2,
                rationale: `Tier L1 TPE — 2 postes inclus + ${Math.max(0, posStations - 2)} × 15€`,
            };
        case 'L2':
            return {
                name: 'Business (PME)',
                basePriceMonthEur: 149 + Math.max(0, siteCount - 1) * 79 + Math.max(0, posStations - 5) * 15,
                includedSites: 1,
                includedPosStations: 5,
                rationale: `Tier L2 PME — 1 site + 5 postes inclus, sites suppl. 79€, postes suppl. 15€`,
            };
        case 'L3':
            return {
                name: 'Enterprise (ETI/Franchise)',
                basePriceMonthEur: 499 + Math.max(0, siteCount - 3) * 149,
                includedSites: 3,
                includedPosStations: 20,
                rationale: `Tier L3 ETI — 3 sites + 20 postes inclus, sites suppl. 149€ (grille dégressive à négocier au-delà de 20 sites)`,
            };
    }
}
