/**
 * 🎓 FormationDeriver — dérive parcours d'onboarding utilisateur + documentation (§C.10 P2d).
 *
 * Produit un plan de formation calibré par tier + par capability :
 *  - L0 → 3 tutos courts (interface ultra-épurée)
 *  - L1 → 5-7 tutos + docs contextuelles
 *  - L2 → plan formation étalé + certifications internes
 *  - L3 → plan complet + certification obligatoire sécurité (santé/HACCP)
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '../qualification/QualificationAnswers';
import type { PrecisionTier } from '../qualification/QualificationEngine';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export interface OnboardingStepSpec {
    readonly id: string;
    readonly label: string;
    readonly kind: 'tutorial' | 'video' | 'doc' | 'live_session';
    readonly durationMinutes: number;
    readonly forRole?: string;
    readonly required: boolean;
    readonly derivedFrom: string;
}

export interface CertificationRequirement {
    readonly id: string;
    readonly label: string;
    readonly required: boolean;
    readonly renewalMonths: number;
    readonly rationale: string;
}

export interface DerivedFormation {
    readonly onboardingPath: readonly OnboardingStepSpec[];
    readonly certificationsRequired: readonly CertificationRequirement[];
    readonly totalOnboardingMinutes: number;
    readonly contextualDocsCount: number;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface FormationDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly tier: PrecisionTier;
    readonly effectiveCapabilities: CapabilitySet;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

function buildCoreSteps(caps: CapabilitySet): OnboardingStepSpec[] {
    const steps: OnboardingStepSpec[] = [
        { id: 'onb.welcome', label: 'Bienvenue et présentation générale', kind: 'video', durationMinutes: 3, required: true, derivedFrom: 'socle universel' }
    ];
    if (caps['mod_pos']) {
        steps.push({ id: 'onb.pos', label: 'Prendre une commande et encaisser', kind: 'tutorial', durationMinutes: 10, required: true, derivedFrom: 'mod_pos = true' });
    }
    if (caps['mod_reservations']) {
        steps.push({ id: 'onb.reservations', label: 'Gérer les réservations et rendez-vous', kind: 'tutorial', durationMinutes: 8, required: true, derivedFrom: 'mod_reservations = true' });
    }
    return steps;
}

function buildTierSteps(tier: PrecisionTier, caps: CapabilitySet): OnboardingStepSpec[] {
    const steps: OnboardingStepSpec[] = [];
    const isL1Plus = tier === 'L1' || tier === 'L2' || tier === 'L3';
    const isL2Plus = tier === 'L2' || tier === 'L3';

    if (isL1Plus) {
        if (caps['mod_inventory']) steps.push({ id: 'onb.inventory', label: 'Gestion des stocks et entrées produits', kind: 'tutorial', durationMinutes: 12, required: true, derivedFrom: `tier=${tier} + mod_inventory` });
        if (caps['mod_hr']) steps.push({ id: 'onb.hr', label: 'Créer et gérer les fiches salariés', kind: 'tutorial', durationMinutes: 15, required: true, forRole: 'rh_manager', derivedFrom: `tier=${tier} + mod_hr` });
    }

    if (isL2Plus) {
        if (caps['mod_haccp']) steps.push({ id: 'onb.haccp', label: 'Relevés HACCP et alertes température', kind: 'tutorial', durationMinutes: 20, required: true, forRole: 'responsable_hygiene', derivedFrom: `tier=${tier} + mod_haccp` });
        if (caps['mod_accounting_management']) steps.push({ id: 'onb.accounting', label: 'Comptabilité et exports FEC', kind: 'video', durationMinutes: 25, required: true, forRole: 'comptable', derivedFrom: `tier=${tier} + mod_accounting` });
        if (caps['mod_analytics']) steps.push({ id: 'onb.analytics', label: 'Lecture des dashboards et rapports', kind: 'doc', durationMinutes: 10, required: false, forRole: 'direction', derivedFrom: `tier=${tier} + mod_analytics` });
    }

    if (tier === 'L3') {
        steps.push({ id: 'onb.fleet', label: 'Supervision multi-établissements (MCC)', kind: 'live_session', durationMinutes: 45, required: true, forRole: 'administrateur_reseau', derivedFrom: 'tier=L3 (franchise/groupe)' });
    }
    return steps;
}

function buildCertifications(tier: PrecisionTier, caps: CapabilitySet, variant: PlatformVariant): CertificationRequirement[] {
    const certs: CertificationRequirement[] = [];
    if (caps["mod_haccp"] || variant === "restaurant") {
        certs.push({ id: "cert.haccp", label: "Hygiène alimentaire et protocole HACCP", required: true, renewalMonths: 60, rationale: "Réglementation paquet hygiène européen CE 852/2004" });
    }
    if (variant === "clinic") {
        certs.push({ id: "cert.dpc", label: "Développement Professionnel Continu (DPC)", required: true, renewalMonths: 36, rationale: "Obligation triennale DPC professionnels de santé" });
    }
    if (variant === "gym") {
        certs.push({ id: "cert.bpjeps", label: "Brevet Professionnel JEPS / CQP Fitness", required: true, renewalMonths: 0, rationale: "Encadrement sportif contre rémunération (Art. L.212-1 Code du Sport)" });
    }
    if (variant === "clinic" || caps["mod_rgpd"]) {
        certs.push({ id: "cert.rgpd_health", label: "Secret professionnel et RGPD données de santé", required: true, renewalMonths: 12, rationale: "Hébergement de Données de Santé (HDS) + secret pro" });
    }
    return certs;
}

export function deriveFormation(input: FormationDeriverInput): DerivedFormation {
    const { variant, tier, effectiveCapabilities: caps } = input;
    const steps = [...buildCoreSteps(caps), ...buildTierSteps(tier, caps)];
    const certs = buildCertifications(tier, caps, variant);

    const totalMinutes = steps.reduce((sum, s) => sum + s.durationMinutes, 0);
    const contextualDocsCount = steps.filter(s => s.kind === 'doc').length + (tier === 'L3' ? 8 : tier === 'L2' ? 5 : 2);

    return {
        onboardingPath: steps,
        certificationsRequired: certs,
        totalOnboardingMinutes: totalMinutes,
        contextualDocsCount,
    };
}
