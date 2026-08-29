/**
 * 🔗 IntegrationsDeriver — suggère les connecteurs externes pertinents (§C.10 P2c).
 *
 * Sortie : liste priorisée de connecteurs suggérés (banking, payment gateway,
 * marketplaces, CRM externe, export paie). Chaque suggestion porte son
 * evidence + son ordre de priorité (1 = fortement recommandé).
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { CompanyProfile } from '@/modules/commerce';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface Integration {
    readonly kind: 'banking' | 'payment_gateway' | 'marketplace' | 'crm' | 'payroll' | 'marketplace_b2b' | 'delivery' | 'analytics';
    readonly provider: string;
    /** 1 = incontournable, 2 = recommandé, 3 = optionnel. */
    readonly priority: 1 | 2 | 3;
    readonly evidence: readonly string[];
    readonly rationale: string;
}

export interface DerivedIntegrations {
    readonly integrations: readonly Integration[];
    readonly banking: Integration | null;
    readonly primaryPaymentGateway: Integration | null;
    readonly derivedFrom: Record<string, string>;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface IntegrationsDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly companyProfile?: CompanyProfile;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

function deriveMarketplaceIntegrations(variant: PlatformVariant, caps: CapabilitySet): Integration[] {
    const list: Integration[] = [];
    if (['restaurant', 'bakery', 'florist'].includes(variant) && caps['mod_omnichannel']) {
        list.push({ kind: 'marketplace', provider: 'Uber Eats', priority: 2, evidence: [`variant=${variant} + mod_omnichannel=true`], rationale: 'Élargit la zone de chalandise via marketplace delivery' });
        list.push({ kind: 'marketplace', provider: 'Deliveroo', priority: 2, evidence: [`variant=${variant} + mod_omnichannel=true`], rationale: 'Alternative delivery indépendante' });
    }
    if ((variant === 'clinic' || variant === 'veterinary') && caps['mod_reservations']) {
        list.push({ kind: 'marketplace', provider: 'Doctolib', priority: 1, evidence: [`variant=${variant} + mod_reservations=true`], rationale: 'Standard de facto pour prise de RDV santé en France' });
    }
    if (variant === 'hotel' && caps['mod_reservations']) {
        list.push({ kind: 'marketplace', provider: 'Booking.com', priority: 1, evidence: ['variant=hotel + mod_reservations=true'], rationale: 'Distribution incontournable pour l\'hôtellerie' });
        list.push({ kind: 'marketplace', provider: 'Expedia', priority: 2, evidence: ['variant=hotel + mod_reservations=true'], rationale: 'Diversification canaux de distribution' });
    }
    return list;
}

function derivePayrollIntegrations(answers: QualificationAnswers): Integration[] {
    const list: Integration[] = [];
    const isEdiOrBig = answers.axis3_payrollComplexity === 'edi_export' || answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti';
    if (isEdiOrBig) {
        list.push({ kind: 'payroll', provider: 'SILAE', priority: 1, evidence: [`axis3_payrollComplexity=${answers.axis3_payrollComplexity}`], rationale: 'Export EDI paie normé — cabinet comptable standard FR' });
        list.push({ kind: 'payroll', provider: 'PayFit', priority: 2, evidence: [`axis1_scale=${answers.axis1_scale}`], rationale: 'Alternative SaaS paie moderne pour PME digitalisées' });
    }
    return list;
}

export function deriveIntegrations(input: IntegrationsDeriverInput): DerivedIntegrations {
    const { answers, variant, effectiveCapabilities: caps, companyProfile } = input;
    const integrations: Integration[] = [];
    const derivedFrom: Record<string, string> = {};

    let primaryPaymentGateway: Integration | null = null;
    if (caps['mod_pos']) {
        const isBig = answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti';
        primaryPaymentGateway = {
            kind: 'payment_gateway',
            provider: isBig ? 'Adyen (négocié)' : 'Stripe',
            priority: 1,
            evidence: [`mod_pos=true, axis1_scale=${answers.axis1_scale}`],
            rationale: isBig ? 'Volume attendu → passerelle enterprise avec conditions négociées' : 'Volume standard → Stripe simple et rapide',
        };
        integrations.push(primaryPaymentGateway);
        derivedFrom['primaryPaymentGateway'] = primaryPaymentGateway.rationale;
    }

    let banking: Integration | null = null;
    if (caps['mod_treasury'] || caps['mod_accounting_management']) {
        const bankHint = detectBankFromWebsite(companyProfile);
        banking = {
            kind: 'banking',
            provider: bankHint ?? 'Qonto (défaut PME)',
            priority: 1,
            evidence: bankHint ? [`bank hint from website: ${bankHint}`] : ['mod_treasury/accounting = true'],
            rationale: 'Rapprochement bancaire automatique via API SEPA (PSD2)',
        };
        integrations.push(banking);
        derivedFrom['banking'] = banking.rationale;
    }

    integrations.push(...deriveMarketplaceIntegrations(variant, caps));
    integrations.push(...derivePayrollIntegrations(answers));

    if (answers.axis1_scale === 'eti' && caps['mod_crm']) {
        integrations.push({ kind: 'crm', provider: 'Salesforce', priority: 3, evidence: ['axis1_scale=eti + mod_crm=true'], rationale: 'CRM enterprise si CRM existant à consolider' });
    }

    return { integrations, banking, primaryPaymentGateway, derivedFrom };
}

function detectBankFromWebsite(profile?: CompanyProfile): string | null {
    if (!profile) return null;
    const txt = JSON.stringify(profile).toLowerCase();
    if (txt.includes('qonto')) return 'Qonto';
    if (txt.includes('shine')) return 'Shine';
    if (txt.includes('revolut')) return 'Revolut Business';
    if (txt.includes('bnpp') || txt.includes('bnp')) return 'BNP Paribas';
    if (txt.includes('societe generale') || txt.includes('sg')) return 'Société Générale';
    return null;
}
