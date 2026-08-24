/**
 * 🔒 RgpdDeriver — dérive la configuration RGPD complète du tenant (§C.10 P2b).
 *
 * Produit :
 *  - registerOfProcessing : registre des traitements auto-généré depuis les
 *    capabilities activées (chaque module = un traitement + ses catégories +
 *    sa base légale + sa durée de conservation).
 *  - piaRequired : analyse d'impact obligatoire si données sensibles Art. 9 RGPD
 *    (santé, biométrie) OU géolocalisation salariés OU décision automatisée.
 *  - dpoRequired : DPO obligatoire si > 250 salariés OU traitements sensibles
 *    réguliers (santé, données à grande échelle).
 *  - retentionByCategory : durées de conservation légales par nature de donnée.
 *  - cookieBanner : bannière requise si mod_analytics OU mod_marketing.
 *  - subProcessors : registre article 28 auto-listant les intégrations utilisées.
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

export function deriveRgpd(input: RgpdDeriverInput): DerivedRgpd {
    const { answers, variant, effectiveCapabilities: caps, estimatedStaff } = input;

    // ── Registre des traitements (dérivé des capabilities) ─────────────────
    const register = buildProcessingRegister(caps, variant);

    // ── PIA (Analyse d'impact) obligatoire ? ───────────────────────────────
    const piaReasons: string[] = [];
    const isHealth = variant === 'clinic' || variant === 'veterinary';
    if (isHealth) piaReasons.push('Secteur santé — données sensibles Art. 9 RGPD systématiques');
    if (answers.axis3_timeTracking === 'biometric_geo') piaReasons.push('Pointage biométrique/géolocalisé — Art. 35 RGPD');
    if (answers.axis6_regulations.includes('rgpd_sensitive')) piaReasons.push('Régulation "rgpd_sensitive" cochée dans axis6');
    if (register.some(p => p.isSensitive)) piaReasons.push('Au moins un traitement inclut des données sensibles');

    // ── DPO obligatoire ? ──────────────────────────────────────────────────
    const dpoReasons: string[] = [];
    if ((estimatedStaff ?? 0) > 250) dpoReasons.push(`Effectif > 250 (${estimatedStaff}) — recommandé WP243 CEPD`);
    if (isHealth) dpoReasons.push('Santé — traitement à grande échelle de données sensibles → DPO obligatoire (Art. 37)');
    if (answers.axis1_topology === 'franchise') dpoReasons.push('Franchise — traitements à grande échelle');

    // ── Rétentions par catégorie ───────────────────────────────────────────
    const retentionByCategory: Record<string, number> = {
        transactions_comptables: 120,       // 10 ans obligatoire (NF525 + Code de commerce)
        contrats_travail: 60,               // 5 ans post-sortie
        candidatures: 24,                   // 2 ans post-décision
        clients_prospects: 36,              // 3 ans post-dernier contact
        clients_marketing: 36,              // 3 ans consentement
        video_surveillance: 1,              // 1 mois max sauf incident
        badge_pointage: 60,                 // 5 ans preuve
        cookies_analytics: 13,              // 13 mois max CNIL
    };
    if (isHealth) retentionByCategory['dossiers_patients'] = 240;  // 20 ans (Code de la santé publique)
    if (answers.axis4_traceability === 'iot_cold_chain' || answers.axis4_traceability === 'recall_fanout') {
        retentionByCategory['iot_temperatures'] = 60;
    }

    // ── Cookie banner ──────────────────────────────────────────────────────
    const cookieCats: string[] = [];
    if (caps['mod_google_analytics']) cookieCats.push('analytics');
    if (caps['mod_marketing'] || caps['mod_social_marketing']) cookieCats.push('marketing');
    if (caps['mod_ai']) cookieCats.push('personalization');
    const cookieBanner = { required: cookieCats.length > 0, categories: cookieCats };

    // ── Sous-traitants (Art. 28) ───────────────────────────────────────────
    const subProcessors: Array<{ name: string; purpose: string; country: string }> = [];
    if (caps['mod_ai'] || caps['mod_oracle']) {
        subProcessors.push({ name: 'Google Gemini API', purpose: 'Génération IA', country: 'US' });
    }
    if (caps['mod_google_analytics']) {
        subProcessors.push({ name: 'Google Analytics', purpose: 'Analytics audience', country: 'US' });
    }
    // La plateforme elle-même est un sous-traitant du tenant — toujours listée
    subProcessors.push({ name: 'RESTAURANT-OS-CORE', purpose: 'Hébergement + traitement métier', country: 'FR' });

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
            isSensitive: isHealth,   // Un client de clinic devient un patient (sensible)
            derivedFrom: `mod_customer = true (variant=${variant})`,
        });
    }
    if (caps['mod_reservations']) {
        records.push({
            id: 'proc.reservations',
            capability: 'mod_reservations',
            purpose: 'Gestion des rendez-vous et créneaux',
            dataCategories: ['identité', 'contact', 'préférences horaires'],
            legalBasis: 'contract',
            retentionMonths: isHealth ? 240 : 36,
            isSensitive: isHealth,
            derivedFrom: `mod_reservations = true (variant=${variant})`,
        });
    }
    if (caps['mod_crm']) {
        records.push({
            id: 'proc.crm',
            capability: 'mod_crm',
            purpose: 'Segmentation RFM et cycle de vie client',
            dataCategories: ['identité', 'contact', 'historique achats', 'scoring'],
            legalBasis: 'legitimate_interest',
            retentionMonths: 36,
            isSensitive: false,
            derivedFrom: 'mod_crm = true',
        });
    }
    if (caps['mod_marketing']) {
        records.push({
            id: 'proc.marketing',
            capability: 'mod_marketing',
            purpose: 'Campagnes marketing (email/SMS)',
            dataCategories: ['identité', 'contact', 'opt-in commercial'],
            legalBasis: 'consent',
            retentionMonths: 36,
            isSensitive: false,
            derivedFrom: 'mod_marketing = true',
        });
    }
    if (caps['mod_hr']) {
        records.push({
            id: 'proc.hr',
            capability: 'mod_hr',
            purpose: 'Gestion des dossiers salariés',
            dataCategories: ['identité', 'contact', 'contrat', 'poste', 'rémunération'],
            legalBasis: 'legal_obligation',
            retentionMonths: 60,
            isSensitive: false,
            derivedFrom: 'mod_hr = true',
        });
    }
    if (caps['mod_timeclock']) {
        records.push({
            id: 'proc.timeclock',
            capability: 'mod_timeclock',
            purpose: 'Pointage entrées/sorties',
            dataCategories: ['identité salarié', 'horodatage'],
            legalBasis: 'legal_obligation',
            retentionMonths: 60,
            isSensitive: false,
            derivedFrom: 'mod_timeclock = true',
        });
    }
    if (isHealth && (caps['mod_customer'] || caps['mod_reservations'])) {
        records.push({
            id: 'proc.patient_records',
            capability: 'mod_customer',
            purpose: 'Dossiers patients / carnets de santé',
            dataCategories: ['identité', 'données de santé', 'antécédents médicaux'],
            legalBasis: 'legal_obligation',
            retentionMonths: 240,
            isSensitive: true,
            derivedFrom: `variant=${variant} → dossiers médicaux sont sensibles Art. 9 RGPD`,
        });
    }
    if (caps['mod_ai']) {
        records.push({
            id: 'proc.ai',
            capability: 'mod_ai',
            purpose: 'Assistance IA (Gemini) — génération de contenu, prédictions',
            dataCategories: ['prompts utilisateur', 'contexte métier anonymisé'],
            legalBasis: 'legitimate_interest',
            retentionMonths: 6,
            isSensitive: false,
            derivedFrom: 'mod_ai = true → sous-traitance Google Gemini',
        });
    }

    return records;
}
