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

export function deriveIntegrations(input: IntegrationsDeriverInput): DerivedIntegrations {
    const { answers, variant, effectiveCapabilities: caps, companyProfile } = input;
    const integrations: Integration[] = [];
    const derivedFrom: Record<string, string> = {};

    // ── Passerelle paiement (dimensionnée par scale) ───────────────────────
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

    // ── Banking (SEPA) ────────────────────────────────────────────────────
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

    // ── Marketplaces delivery (resto/bakery/florist) ──────────────────────
    if (['restaurant', 'bakery', 'florist'].includes(variant) && caps['mod_omnichannel']) {
        integrations.push({
            kind: 'marketplace',
            provider: 'Uber Eats',
            priority: 2,
            evidence: [`variant=${variant} + mod_omnichannel=true`],
            rationale: 'Élargit la zone de chalandise via marketplace delivery',
        });
        integrations.push({
            kind: 'marketplace',
            provider: 'Deliveroo',
            priority: 2,
            evidence: [`variant=${variant} + mod_omnichannel=true`],
            rationale: 'Alternative delivery indépendante',
        });
    }

    // ── Marketplace santé ──────────────────────────────────────────────────
    if ((variant === 'clinic' || variant === 'veterinary') && caps['mod_reservations']) {
        integrations.push({
            kind: 'marketplace',
            provider: 'Doctolib',
            priority: 1,
            evidence: [`variant=${variant} + mod_reservations=true`],
            rationale: 'Standard de facto pour prise de RDV santé en France',
        });
    }

    // ── Marketplace hôtelier ──────────────────────────────────────────────
    if (variant === 'hotel' && caps['mod_reservations']) {
        integrations.push({
            kind: 'marketplace',
            provider: 'Booking.com',
            priority: 1,
            evidence: [`variant=hotel + mod_reservations=true`],
            rationale: 'Distribution incontournable pour l\'hôtellerie',
        });
        integrations.push({
            kind: 'marketplace',
            provider: 'Expedia',
            priority: 2,
            evidence: [`variant=hotel + mod_reservations=true`],
            rationale: 'Diversification canaux de distribution',
        });
    }

    // ── Export paie ────────────────────────────────────────────────────────
    if (answers.axis3_payrollComplexity === 'edi_export' || answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti') {
        integrations.push({
            kind: 'payroll',
            provider: 'SILAE',
            priority: 1,
            evidence: [`axis3_payrollComplexity=${answers.axis3_payrollComplexity}`],
            rationale: 'Export EDI paie normé — cabinet comptable standard FR',
        });
        integrations.push({
            kind: 'payroll',
            provider: 'PayFit',
            priority: 2,
            evidence: [`axis1_scale=${answers.axis1_scale}`],
            rationale: 'Alternative SaaS paie moderne pour PME digitalisées',
        });
    }

    // ── CRM externe (grands comptes) ──────────────────────────────────────
    if (answers.axis1_scale === 'eti' && caps['mod_crm']) {
        integrations.push({
            kind: 'crm',
            provider: 'Salesforce',
            priority: 3,
            evidence: [`axis1_scale=eti + mod_crm=true`],
            rationale: 'CRM enterprise si CRM existant à consolider',
        });
    }

    // ── Marketplaces B2B (resto pro) ──────────────────────────────────────
    if (variant === 'restaurant' && caps['mod_inventory']) {
        integrations.push({
            kind: 'marketplace_b2b',
            provider: 'Metro Cash & Carry',
            priority: 3,
            evidence: [`variant=restaurant + mod_inventory`],
            rationale: 'Fournisseur B2B métier bouche',
        });
    }

    // ── Analytics ─────────────────────────────────────────────────────────
    if (caps['mod_google_analytics']) {
        integrations.push({
            kind: 'analytics',
            provider: 'Google Analytics 4',
            priority: 2,
            evidence: ['mod_google_analytics = true'],
            rationale: 'Standard de mesure audience web',
        });
    }

    derivedFrom['integrations_count'] = `${integrations.length} connecteurs suggérés au total`;

    return { integrations, banking, primaryPaymentGateway, derivedFrom };
}

// ── Helper : détection basique de banque depuis le site ────────────────────────

function detectBankFromWebsite(cp?: CompanyProfile): string | null {
    if (!cp) return null;
    const corpus = cp.raw.pagesCrawled.join(' ') + ' ' + cp.raw.warnings.join(' ');
    if (/qonto/i.test(corpus)) return 'Qonto';
    if (/credit\s?agricole|c\.a\.|crédit\s?agricole/i.test(corpus)) return 'Crédit Agricole';
    if (/bnp/i.test(corpus)) return 'BNP Paribas';
    if (/societe\s?generale|société\s?générale/i.test(corpus)) return 'Société Générale';
    if (/lcl/i.test(corpus)) return 'LCL';
    return null;
}
