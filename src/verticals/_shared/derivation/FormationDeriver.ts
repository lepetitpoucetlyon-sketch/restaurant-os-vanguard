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

export function deriveFormation(input: FormationDeriverInput): DerivedFormation {
    const { variant, tier, effectiveCapabilities: caps } = input;
    const steps: OnboardingStepSpec[] = [];

    // ── Socle universel ────────────────────────────────────────────────────
    steps.push({
        id: 'onb.welcome',
        label: 'Bienvenue et présentation générale',
        kind: 'video',
        durationMinutes: 3,
        required: true,
        derivedFrom: 'socle universel',
    });
    if (caps['mod_pos']) {
        steps.push({
            id: 'onb.pos',
            label: 'Prendre une commande et encaisser',
            kind: 'tutorial',
            durationMinutes: 10,
            required: true,
            derivedFrom: 'mod_pos = true',
        });
    }
    if (caps['mod_reservations']) {
        steps.push({
            id: 'onb.reservations',
            label: 'Gérer les réservations et rendez-vous',
            kind: 'tutorial',
            durationMinutes: 8,
            required: true,
            derivedFrom: 'mod_reservations = true',
        });
    }

    // ── L1+ ajoute des tutos supplémentaires ──────────────────────────────
    if (tier === 'L1' || tier === 'L2' || tier === 'L3') {
        if (caps['mod_inventory']) {
            steps.push({
                id: 'onb.inventory',
                label: 'Gestion des stocks et entrées produits',
                kind: 'tutorial',
                durationMinutes: 12,
                required: true,
                derivedFrom: `tier=${tier} + mod_inventory`,
            });
        }
        if (caps['mod_hr']) {
            steps.push({
                id: 'onb.hr',
                label: 'Créer et gérer les fiches salariés',
                kind: 'tutorial',
                durationMinutes: 15,
                required: true,
                forRole: 'rh_manager',
                derivedFrom: `tier=${tier} + mod_hr`,
            });
        }
    }

    // ── L2 : docs contextuelles + tutos avancés ────────────────────────────
    if (tier === 'L2' || tier === 'L3') {
        if (caps['mod_haccp']) {
            steps.push({
                id: 'onb.haccp',
                label: 'Relevés HACCP et alertes température',
                kind: 'tutorial',
                durationMinutes: 20,
                required: true,
                forRole: 'responsable_hygiene',
                derivedFrom: `tier=${tier} + mod_haccp`,
            });
        }
        if (caps['mod_accounting_management']) {
            steps.push({
                id: 'onb.accounting',
                label: 'Comptabilité et exports FEC',
                kind: 'video',
                durationMinutes: 25,
                required: true,
                forRole: 'comptable',
                derivedFrom: `tier=${tier} + mod_accounting`,
            });
        }
        if (caps['mod_analytics']) {
            steps.push({
                id: 'onb.analytics',
                label: 'Lecture des dashboards et rapports',
                kind: 'video',
                durationMinutes: 15,
                required: false,
                forRole: 'manager',
                derivedFrom: `tier=${tier} + mod_analytics`,
            });
        }
    }

    // ── L3 : session live + plan étalé ─────────────────────────────────────
    if (tier === 'L3') {
        steps.push({
            id: 'onb.live_kickoff',
            label: 'Session live d\'onboarding avec un expert',
            kind: 'live_session',
            durationMinutes: 60,
            required: true,
            derivedFrom: 'tier=L3 → accompagnement premium',
        });
        if (caps['mod_fleet_management']) {
            steps.push({
                id: 'onb.fleet',
                label: 'Supervision multi-établissements (MCC)',
                kind: 'video',
                durationMinutes: 30,
                required: true,
                forRole: 'direction',
                derivedFrom: 'tier=L3 + mod_fleet',
            });
        }
    }

    // ── Certifications obligatoires ────────────────────────────────────────
    const certifications: CertificationRequirement[] = [];
    if (variant === 'restaurant' || variant === 'bakery') {
        certifications.push({
            id: 'cert.haccp',
            label: 'Formation hygiène alimentaire (14h HACCP)',
            required: true,
            renewalMonths: 60,
            rationale: 'Décret 2011-731 : au moins 1 salarié formé HACCP par établissement',
        });
    }
    if (variant === 'clinic' || variant === 'veterinary') {
        certifications.push({
            id: 'cert.dpc',
            label: 'Développement Professionnel Continu (DPC)',
            required: true,
            renewalMonths: 36,
            rationale: 'Obligation triennale pour professionnels de santé',
        });
    }
    if (variant === 'garage') {
        certifications.push({
            id: 'cert.fluides',
            label: 'Attestation de capacité fluides frigorigènes',
            required: false,
            renewalMonths: 60,
            rationale: 'Si intervention clim automobile (R134a/R1234yf)',
        });
    }
    if (variant === 'gym') {
        certifications.push({
            id: 'cert.bpjeps',
            label: 'BPJEPS ou équivalent pour coach',
            required: true,
            renewalMonths: 0, // sans expiration
            rationale: 'Diplôme d\'État obligatoire pour encadrement contre rémunération',
        });
    }

    const totalOnboardingMinutes = steps.reduce((sum, s) => sum + s.durationMinutes, 0);
    const contextualDocsCount = Math.floor(Object.values(caps).filter(v => v === true).length * 1.5);

    return {
        onboardingPath: steps,
        certificationsRequired: certifications,
        totalOnboardingMinutes,
        contextualDocsCount,
    };
}
