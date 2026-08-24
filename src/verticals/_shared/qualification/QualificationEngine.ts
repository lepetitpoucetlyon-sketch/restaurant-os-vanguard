/**
 * 🧠 QualificationEngine — le pivot recherche → provisioning.
 *
 * Rôles :
 *  1. `inferAnswers(profile, study)` → auto-remplit les 7 axes depuis les signaux
 *     (l'opérateur ne fait que confirmer).
 *  2. `calibrateDepth(answers, profile)` → propose un tier L0-L3 recommandé.
 *  3. `resolve(answers, variant, profile, study)` → produit un `QualificationProfile`
 *     complet incluant tier + capabilities + hardware + rôles + businessLaws.
 *
 * Consomme la Couche de Dérivation (§C.10) : RbacDeriver + BusinessLawsDeriver
 * en P2a, +11 autres en P2b/c/d. Chaque dériveur ajoute sa clé au résultat sans
 * casser l'existant (rétro-compatible).
 *
 * Sortie utilisée par : ProvisioningWizard (UI), BlindSpotDetector (§C.9),
 * TenantSeeder (écriture Nexus finale, après validation opérateur).
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet, CapabilityKey, HardwareKind } from '../catalog/CapabilityCatalog';
import { resolveCapabilityDependencies, requiredHardwareFor } from '../catalog/CapabilityCatalog';
import type { SectorStudy } from '../blueprint/SectorStudy';
import type { CompanyProfile } from '@/modules/commerce';
import { deriveRbac, type RolesTemplate } from '../derivation/RbacDeriver';
import { deriveBusinessLaws, type DerivedBusinessLaws } from '../derivation/BusinessLawsDeriver';
import type { QualificationAnswers, AiLevel } from './QualificationAnswers';
import { defaultAnswers } from './QualificationAnswers';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export type PrecisionTier = 'L0' | 'L1' | 'L2' | 'L3';

/** Suggestion de feature/module surfaced à l'opérateur avec sa raison. */
export interface FeatureSuggestion {
    readonly capability: CapabilityKey;
    readonly evidence: readonly string[];
    readonly rationale: string;
}

export interface QualificationProfile {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly recommendedTier: PrecisionTier;
    readonly capabilities: CapabilitySet;
    readonly hardware: readonly HardwareKind[];
    readonly suggestedFeatures: readonly FeatureSuggestion[];
    readonly displayDepthDefault: 'essential' | 'manager' | 'enterprise';

    // Dériveurs P2a
    readonly roles: RolesTemplate;
    readonly businessLaws: DerivedBusinessLaws;

    // Métadonnées
    readonly aiLevel: AiLevel;
    readonly derivedAt: string;
}

// ── inferAnswers ────────────────────────────────────────────────────────────────

/**
 * Auto-inférence des 7 axes depuis un CompanyProfile scrapé + une SectorStudy.
 * Résultat : QualificationAnswers partiel — l'opérateur confirme/complète dans
 * le wizard. On ne devine JAMAIS ce qui n'a aucun signal.
 */
export function inferAnswers(
    profile: CompanyProfile,
    study: SectorStudy,
): Partial<QualificationAnswers> {
    const inferred: Partial<QualificationAnswers> = {};

    // ── Axe 1 — Échelle ────────────────────────────────────────────────────
    if (profile.scale.multiSite === true) {
        const siteCount = profile.scale.siteCount ?? 2;
        inferred.axis1_topology = siteCount >= 10 ? 'franchise' : 'multi_independent';
        inferred.axis1_siteCount = siteCount;
        inferred.axis1_scale = siteCount >= 10 ? 'eti' : siteCount >= 3 ? 'pme' : 'tpe';
    }
    if (profile.scale.estimatedStaff !== undefined) {
        inferred.axis1_estimatedStaff = profile.scale.estimatedStaff;
        if (profile.scale.estimatedStaff >= 50) inferred.axis1_scale = 'eti';
        else if (profile.scale.estimatedStaff >= 10) inferred.axis1_scale = 'pme';
        else if (profile.scale.estimatedStaff >= 2) inferred.axis1_scale = 'tpe';
        else inferred.axis1_scale = 'solo';
    }

    // ── Axe 4 — Nature du stock ────────────────────────────────────────────
    const hasPerishable = profile.catalog.some(i => /frais|glace|surgelé|viande|poisson|fromage|yaourt|primeurs?|bouquet|fleur/i.test(i.name + i.category));
    if (hasPerishable) inferred.axis4_stockNature = 'perishable';
    else if (profile.catalog.length > 0) {
        const hasRecipes = profile.catalog.some(i => /plat|menu|formule|recette/i.test(i.name + i.category));
        inferred.axis4_stockNature = hasRecipes ? 'raw_recipes' : 'finished_goods';
    }

    // ── Axe 6 — Régulations sectorielles ──────────────────────────────────
    const regs: QualificationAnswers['axis6_regulations'] = [];
    for (const reg of study.regulations) {
        const label = (reg.label + ' ' + (reg.description ?? '')).toLowerCase();
        if (/haccp|pms|hygiène/i.test(label)) regs.push('haccp');
        if (/allergène|inco/i.test(label)) regs.push('allergen_inco');
        if (/agec|bio-déchet|biodéchet/i.test(label)) regs.push('agec');
        if (/ppsps|chantier/i.test(label)) regs.push('ppsps');
        if (/bsdd|déchet dangereux/i.test(label)) regs.push('bsdd');
        if (/piec|piece.*économie.*circulaire/i.test(label)) regs.push('piec');
        if (/hds|hébergeur.*santé/i.test(label)) regs.push('hds');
        if (/erp|incendie|baes/i.test(label)) regs.push('erp_safety');
        if (/sacem|sprea/i.test(label)) regs.push('sacem_music');
    }
    if (profile.sectorSignals.detectedVariant === 'clinic' || profile.sectorSignals.detectedVariant === 'veterinary') {
        regs.push('rgpd_sensitive');
    }
    if (regs.length) inferred.axis6_regulations = Array.from(new Set(regs));

    // ── Axe 2 — Modèle commercial (héuristique légère) ────────────────────
    const hasSubscriptions = profile.catalog.some(i => /abonnement|forfait mensuel|pass/i.test(i.name));
    if (hasSubscriptions) inferred.axis2_commerceModel = 'subscriptions';

    return inferred;
}

// ── calibrateDepth ──────────────────────────────────────────────────────────────

/**
 * Propose un tier L0-L3 à partir des answers + profile. Règles claires :
 *  - eti OU franchise → L3
 *  - pme OU payroll complexe → L2
 *  - tpe → L1
 *  - solo → L0
 */
export function calibrateDepth(answers: QualificationAnswers): PrecisionTier {
    if (answers.axis1_scale === 'eti' || answers.axis1_topology === 'franchise') return 'L3';
    if (answers.axis1_scale === 'pme' || answers.axis3_payrollComplexity !== 'standard_35h') return 'L2';
    if (answers.axis1_scale === 'tpe') return 'L1';
    return 'L0';
}

// ── resolveCapabilities ────────────────────────────────────────────────────────

/**
 * Traduit les answers en set de capabilities activées + hardware requis.
 * Chaque axe active un ou plusieurs `mod_*` selon la réponse choisie. La
 * résolution transitive `dependsOn` est appliquée à la fin.
 */
export function resolveCapabilitiesFromAnswers(answers: QualificationAnswers): {
    capabilities: CapabilitySet;
    hardware: readonly HardwareKind[];
    suggestedFeatures: FeatureSuggestion[];
} {
    const caps: CapabilitySet = { mod_dashboard: true, mod_settings: true, mod_access_management: true, mod_brand_basic: true };
    const suggested: FeatureSuggestion[] = [];

    // ── Axe 1 — Échelle → RBAC + HR ────────────────────────────────────────
    if (answers.axis1_scale === 'tpe' || answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti') {
        caps.mod_hr = true;
        suggested.push({ capability: 'mod_hr', evidence: [`axis1_scale=${answers.axis1_scale}`], rationale: 'Dossiers salariés obligatoires dès le 1er contrat.' });
    }
    if (answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti') {
        caps.mod_analytics = true;
    }
    if (answers.axis1_scale === 'eti' || answers.axis1_topology === 'franchise') {
        caps.mod_fleet_management = true;
        suggested.push({ capability: 'mod_fleet_management', evidence: [`axis1_topology=${answers.axis1_topology}`], rationale: 'Supervision multi-établissements obligatoire à cette échelle.' });
    }

    // ── Axe 2 — Modèle commercial → POS/Devis ─────────────────────────────
    if (answers.axis2_commerceModel === 'b2c_counter' || answers.axis2_commerceModel === 'mixed') {
        caps.mod_pos = true;
    }
    if (answers.axis2_commerceModel === 'b2b_quotes' || answers.axis2_commerceModel === 'mixed') {
        caps.mod_quotes = true;
        caps.mod_customer = true;
    }
    if (answers.axis2_commerceModel === 'subscriptions') {
        caps.mod_customer = true;
    }

    // ── Axe 3 — Temps de travail / paie ───────────────────────────────────
    if (answers.axis3_timeTracking === 'digital_clock' || answers.axis3_timeTracking === 'biometric_geo') {
        caps.mod_timeclock = true;
        caps.mod_hr = true;
    }
    if (answers.axis3_timeTracking === 'planning' || answers.axis3_timeTracking === 'digital_clock') {
        caps.mod_planning = true;
        caps.mod_hr = true;
    }

    // ── Axe 4 — Stock ──────────────────────────────────────────────────────
    if (answers.axis4_stockNature !== 'zero_stock') caps.mod_inventory = true;
    if (answers.axis4_stockNature === 'raw_recipes' || answers.axis4_stockNature === 'perishable') {
        caps.mod_kitchen_management = true;
    }
    if (answers.axis4_stockNature === 'perishable') {
        caps.mod_haccp = true;
        suggested.push({ capability: 'mod_haccp', evidence: [`axis4_stockNature=perishable`], rationale: 'Périssable → HACCP + traçabilité obligatoires.' });
    }

    // ── Axe 5 — Hardware production ──────────────────────────────────────
    if (answers.axis5_production === 'kds_screens' || answers.axis5_production === 'multi_printers') {
        caps.mod_kds = true;
        caps.mod_pos = true;
    }
    if (answers.axis5_production === 'kiosk') {
        caps.mod_kiosk = true;
        caps.mod_pos = true;
    }

    // ── Axe 6 — Régulations ──────────────────────────────────────────────
    if (answers.axis6_regulations.includes('haccp')) caps.mod_haccp = true;
    if (answers.axis6_regulations.includes('rgpd_sensitive')) caps.mod_rgpd = true;
    if (answers.axis6_regulations.includes('erp_safety')) caps.mod_registre = true;

    // ── Axe 7 — IA ───────────────────────────────────────────────────────
    if (answers.axis7_aiLevel >= 2) caps.mod_ai = true;
    if (answers.axis7_aiLevel >= 2) caps.mod_oracle = true;

    // ── Résolution transitive + hardware ─────────────────────────────────
    const activeKeys = (Object.keys(caps) as CapabilityKey[]).filter(k => caps[k] === true);
    for (const dep of resolveCapabilityDependencies(activeKeys)) caps[dep] = true;
    const hardware = requiredHardwareFor(activeKeys);

    return { capabilities: caps, hardware, suggestedFeatures: suggested };
}

// ── DisplayDepth par défaut ─────────────────────────────────────────────────────

export function defaultDisplayDepth(answers: QualificationAnswers): 'essential' | 'manager' | 'enterprise' {
    if (answers.axis1_scale === 'eti' || answers.axis1_rbac === 'granular') return 'enterprise';
    if (answers.axis1_scale === 'pme' || answers.axis1_rbac === 'standard') return 'manager';
    return 'essential';
}

// ── resolve ────────────────────────────────────────────────────────────────────

/**
 * Orchestrateur principal : consomme les answers + variant + optionnel profile
 * et retourne un `QualificationProfile` complet prêt pour le TenantSeeder.
 * Non écrit — préparation seule.
 */
export function resolve(input: {
    answers: QualificationAnswers;
    variant: PlatformVariant;
    companyProfile?: CompanyProfile;
    study?: SectorStudy;
    at?: Date;
}): QualificationProfile {
    const { answers, variant, companyProfile, at } = input;
    const recommendedTier = calibrateDepth(answers);
    const { capabilities, hardware, suggestedFeatures } = resolveCapabilitiesFromAnswers(answers);

    const roles = deriveRbac({
        answers,
        variant,
        effectiveCapabilities: capabilities,
        siteCount: answers.axis1_siteCount ?? 1,
    });
    const businessLaws = deriveBusinessLaws({ answers, variant, companyProfile });

    return {
        answers,
        variant,
        recommendedTier,
        capabilities,
        hardware,
        suggestedFeatures,
        displayDepthDefault: defaultDisplayDepth(answers),
        roles,
        businessLaws,
        aiLevel: answers.axis7_aiLevel,
        derivedAt: (at ?? new Date()).toISOString(),
    };
}

/** Sucres d'API groupés. */
export const QualificationEngine = {
    inferAnswers,
    calibrateDepth,
    resolveCapabilitiesFromAnswers,
    defaultDisplayDepth,
    resolve,
    defaultAnswers,
} as const;
