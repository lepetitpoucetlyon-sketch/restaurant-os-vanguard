/**
 * 🔒 RgpdDeriver — dérive la configuration RGPD complète du tenant (§C.10 P2b).
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet, CapabilityKey } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';

// ── Types de sortie ─────────────────────────────────────────────────────────────

/** Base légale RGPD (Art. 6). */
export type LegalBasis = 'contract' | 'legal_obligation' | 'legitimate_interest' | 'consent' | 'vital_interest' | 'public_task';

export interface ProcessingRecord {
    readonly id: string;
    readonly capability: CapabilityKey;
    readonly purpose: string;
    readonly dataCategories: readonly string[];
    readonly legalBasis: LegalBasis;
    readonly retentionMonths: number;
    readonly isSensitive: boolean;    // Art. 9 RGPD
    readonly derivedFrom: string;
}

export interface DerivedRgpd {
    readonly registerOfProcessing: readonly ProcessingRecord[];
    readonly piaRequired: boolean;
    readonly piaReasons: readonly string[];
    readonly dpoRequired: boolean;
    readonly dpoReasons: readonly string[];
    readonly retentionByCategory: Record<string, number>;      // months
    readonly cookieBanner: { required: boolean; categories: readonly string[] };
    readonly subProcessors: readonly { name: string; purpose: string; country: string }[];
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface RgpdDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    readonly estimatedStaff?: number;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

function derivePiaReasons(isHealth: boolean, answers: QualificationAnswers, register: readonly ProcessingRecord[]): string[] {
    const reasons: string[] = [];
    if (isHealth) reasons.push('Secteur santé — données sensibles Art. 9 RGPD systématiques');
    if (answers.axis3_timeTracking === 'biometric_geo') reasons.push('Pointage biométrique/géolocalisé — Art. 35 RGPD');
    if (answers.axis6_regulations.includes('rgpd_sensitive')) reasons.push('Régulation "rgpd_sensitive" cochée dans axis6');
    if (register.some(p => p.isSensitive)) reasons.push('Au moins un traitement inclut des données sensibles');
    return reasons;
}

function deriveDpoReasons(isHealth: boolean, estimatedStaff: number | undefined, answers: QualificationAnswers): string[] {
    const reasons: string[] = [];
    if ((estimatedStaff ?? 0) > 250) reasons.push(`Effectif > 250 (${estimatedStaff}) — recommandé WP243 CEPD`);
    if (isHealth) reasons.push('Santé — traitement à grande échelle de données sensibles → DPO obligatoire (Art. 37)');
    if (answers.axis1_topology === 'franchise') reasons.push('Franchise — traitements à grande échelle');
    return reasons;
}

function deriveCookieBanner(caps: CapabilitySet): { required: boolean; categories: string[] } {
    const cookieCats: string[] = [];
    if (caps['mod_google_analytics']) cookieCats.push('analytics');
    if (caps['mod_marketing'] || caps['mod_social_marketing']) cookieCats.push('marketing');
    if (caps['mod_ai']) cookieCats.push('personalization');
    return { required: cookieCats.length > 0, categories: cookieCats };
}

function deriveSubProcessors(caps: CapabilitySet): Array<{ name: string; purpose: string; country: string }> {
    const subProcessors: Array<{ name: string; purpose: string; country: string }> = [];
    if (caps['mod_ai'] || caps['mod_oracle']) {
        subProcessors.push({ name: 'Google Gemini API', purpose: 'Génération IA', country: 'US' });
    }
    if (caps['mod_google_analytics']) {
        subProcessors.push({ name: 'Google Analytics', purpose: 'Analytics audience', country: 'US' });
    }
    subProcessors.push({ name: 'RESTAURANT-OS-CORE', purpose: 'Hébergement + traitement métier', country: 'FR' });
    return subProcessors;
}

function deriveRetentionPolicies(isHealth: boolean, answers: QualificationAnswers): Record<string, number> {
    const retention: Record<string, number> = {
        transactions_comptables: 120,
        contrats_travail: 60,
        candidatures: 24,
        clients_prospects: 36,
        clients_marketing: 36,
        video_surveillance: 1,
        badge_pointage: 60,
        cookies_analytics: 13,
    };
    if (isHealth) retention['dossiers_patients'] = 240;
    if (answers.axis4_traceability === 'iot_cold_chain' || answers.axis4_traceability === 'recall_fanout') {
        retention['iot_temperatures'] = 60;
    }
    return retention;
}

export function deriveRgpd(input: RgpdDeriverInput): DerivedRgpd {
    const { answers, variant, effectiveCapabilities: caps, estimatedStaff } = input;
    const isHealth = variant === 'clinic' || variant === 'veterinary';
    const register = buildProcessingRegister(caps, variant);

    const piaReasons = derivePiaReasons(isHealth, answers, register);
    const dpoReasons = deriveDpoReasons(isHealth, estimatedStaff, answers);
    const retentionByCategory = deriveRetentionPolicies(isHealth, answers);
    const cookieBanner = deriveCookieBanner(caps);
    const subProcessors = deriveSubProcessors(caps);

    return {
        registerOfProcessing: register,
        piaRequired: piaReasons.length > 0,
        piaReasons,
        dpoRequired: dpoReasons.length > 0,
        dpoReasons,
        retentionByCategory,
        cookieBanner,
        subProcessors,
    };
}

// ── Registre des traitements ────────────────────────────────────────────────────

function buildProcessingRegister(caps: CapabilitySet, variant: PlatformVariant): ProcessingRecord[] {
    const records: ProcessingRecord[] = [];
    const isHealth = variant === 'clinic' || variant === 'veterinary';

    if (caps['mod_pos']) {
        records.push({
            id: 'proc.pos',
            capability: 'mod_pos',
            purpose: 'Enregistrement des ventes et émission de tickets NF525',
            dataCategories: ['identité tenant', 'transactions', 'moyens paiement anonymisés'],
            legalBasis: 'legal_obligation',
            retentionMonths: 120,
            isSensitive: false,
            derivedFrom: 'mod_pos = true → obligation fiscale NF525',
        });
    }
    if (caps['mod_customer']) {
        records.push({
            id: 'proc.customer',
            capability: 'mod_customer',
            purpose: 'Gestion fiche client',
            dataCategories: ['identité', 'contact', 'préférences'],
            legalBasis: 'contract',
            retentionMonths: 36,
            isSensitive: isHealth,
            derivedFrom: `mod_customer = true (variant=${variant})`,
        });
    }
    if (caps['mod_reservations']) {
        records.push({
            id: 'proc.reservations',
            capability: 'mod_reservations',
            purpose: 'Gestion des rendez-vous et créneaux',
            dataCategories: ['identité', 'contact', 'date_heure'],
            legalBasis: 'contract',
            retentionMonths: 36,
            isSensitive: isHealth,
            derivedFrom: 'mod_reservations = true',
        });
    }
    if (caps['mod_hr']) {
        records.push({
            id: 'proc.hr',
            capability: 'mod_hr',
            purpose: 'Dossier salarié, paie et registre unique du personnel (RUP)',
            dataCategories: ['identité', 'NIR/sécurité sociale', 'coordonnées bancaires', 'contrat', 'heures'],
            legalBasis: 'legal_obligation',
            retentionMonths: 60,
            isSensitive: false,
            derivedFrom: 'mod_hr = true',
        });
    }
    if (caps['mod_marketing']) {
        records.push({
            id: 'proc.marketing',
            capability: 'mod_marketing',
            purpose: 'Campagnes email/SMS et programmes fidélité',
            dataCategories: ['contact', 'historique achats', 'segments'],
            legalBasis: 'consent',
            retentionMonths: 36,
            isSensitive: false,
            derivedFrom: 'mod_marketing = true → base légale = consentement',
        });
    }

    return records;
}
