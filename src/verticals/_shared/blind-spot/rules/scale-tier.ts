/**
 * 📏 Règles d'angles morts — famille "scale_tier_mismatch".
 *
 * Les signaux de scrape indiquent une taille/topologie précise, mais le tier
 * proposé ou les capabilities activées sont sous-dimensionnées.
 */

import type { BlindSpotRule, RuleOutput } from '../BlindSpotDetector';

// ── R.1 Multi-site sans capability multisite ────────────────────────────────────

export const MULTISITE_WITHOUT_CAPABILITY: BlindSpotRule = {
    id: 'bs.scale.multisite_without_capability',
    family: 'scale_tier_mismatch',
    scope: 'tenant',
    defaultTitle: 'Multi-sites détecté sans capabilities de coordination',
    detectTenant(ctx) {
        if (ctx.companyProfile.scale.multiSite !== true) return null;
        const siteCount = ctx.companyProfile.scale.siteCount ?? 2;
        // On regarde les capabilities pertinentes (mod_multisite / mod_franchise n'existent pas
        // dans le catalog actuel → on suggère au moins mod_fleet_management)
        if (ctx.qualification.capabilities['mod_fleet_management'] === true) return null;
        return fix('high',
            [`companyProfile.scale.multiSite = true (${siteCount} sites détectés)`,
             `evidence: ${ctx.companyProfile.scale.evidence.join(' ; ') || '—'}`,
             `qualification.capabilities.mod_fleet_management = ${ctx.qualification.capabilities['mod_fleet_management']}`],
            'enable_capability', 'mod_fleet_management',
            'Multi-sites → gestion de flotte MCC obligatoire pour consolider.');
    },
};

// ── R.2 Franchise sans tier L3 ──────────────────────────────────────────────────

export const FRANCHISE_WITHOUT_L3: BlindSpotRule = {
    id: 'bs.scale.franchise_tier_too_low',
    family: 'scale_tier_mismatch',
    scope: 'tenant',
    defaultTitle: 'Signaux de franchise mais tier L1/L2 proposé',
    detectTenant(ctx) {
        const siteCount = ctx.companyProfile.scale.siteCount ?? 0;
        const isFranchise = siteCount >= 10 || ctx.companyProfile.scale.evidence.some(e => /franchise|réseau/i.test(e));
        if (!isFranchise) return null;
        if (ctx.qualification.recommendedTier === 'L3') return null;
        return fix('critical',
            [`siteCount=${siteCount}, evidence=${ctx.companyProfile.scale.evidence.join(' ; ') || '—'}`,
             `qualification.recommendedTier = ${ctx.qualification.recommendedTier}`],
            'raise_tier', 'L3',
            'Franchise / réseau ≥ 10 sites → tier L3 (ETI) requis pour gouvernance, audit, consolidation.');
    },
};

// ── R.3 Catalogue riche sans analytics ──────────────────────────────────────────

export const RICH_CATALOG_WITHOUT_ANALYTICS: BlindSpotRule = {
    id: 'bs.scale.rich_catalog_no_analytics',
    family: 'scale_tier_mismatch',
    scope: 'tenant',
    defaultTitle: 'Catalogue > 100 items sans mod_analytics',
    detectTenant(ctx) {
        if (ctx.companyProfile.catalog.length < 100) return null;
        if (ctx.qualification.capabilities['mod_analytics'] === true) return null;
        return fix('medium',
            [`companyProfile.catalog.length = ${ctx.companyProfile.catalog.length}`,
             `qualification.capabilities.mod_analytics = ${ctx.qualification.capabilities['mod_analytics']}`],
            'enable_capability', 'mod_analytics',
            'Volume catalogue élevé → analytics de vente indispensable pour piloter.');
    },
};

// ── R.4 Enterprise (L3) sans fleet_management ───────────────────────────────────

export const L3_WITHOUT_FLEET: BlindSpotRule = {
    id: 'bs.scale.l3_without_fleet',
    family: 'scale_tier_mismatch',
    scope: 'tenant',
    defaultTitle: 'Tier L3 sans mod_fleet_management',
    detectTenant(ctx) {
        if (ctx.qualification.recommendedTier !== 'L3') return null;
        if (ctx.qualification.capabilities['mod_fleet_management'] === true) return null;
        return fix('high',
            [`qualification.recommendedTier = L3`,
             `qualification.capabilities.mod_fleet_management = ${ctx.qualification.capabilities['mod_fleet_management']}`],
            'enable_capability', 'mod_fleet_management',
            'Tier L3 (ETI/franchise) sans supervision multi-établissements → dashboard flotte manquant.');
    },
};

// ── R.5 Blueprint L2+ sans study substance ──────────────────────────────────────

export const L2_BLUEPRINT_WITHOUT_SUBSTANCE: BlindSpotRule = {
    id: 'bs.scale.l2_blueprint_no_substance',
    family: 'scale_tier_mismatch',
    scope: 'vertical',
    defaultTitle: 'Blueprint L2/L3 sans SectorStudy attaché',
    detectVertical(ctx) {
        if (ctx.blueprint.precision !== 'L2' && ctx.blueprint.precision !== 'L3') return null;
        if (ctx.blueprint.substance) return null;
        return fix('critical',
            [`blueprint.precision = ${ctx.blueprint.precision}`,
             `blueprint.substance = undefined`],
            'manual', 'substance',
            'Un blueprint L2/L3 exige une SectorStudy — nourrit KPIs/workflows/regulations pour la génération riche.');
    },
};

// ── Helper ──────────────────────────────────────────────────────────────────────

function fix(
    severity: 'critical' | 'high' | 'medium' | 'low',
    evidence: string[],
    kind: 'enable_capability' | 'raise_tier' | 'add_hardware' | 'add_guard' | 'add_route' | 'manual',
    target: string,
    rationale: string,
): RuleOutput {
    return { severity, evidence, suggestedFix: { kind, target, rationale } };
}

export const SCALE_TIER_RULES: readonly BlindSpotRule[] = [
    MULTISITE_WITHOUT_CAPABILITY,
    FRANCHISE_WITHOUT_L3,
    RICH_CATALOG_WITHOUT_ANALYTICS,
    L3_WITHOUT_FLEET,
    L2_BLUEPRINT_WITHOUT_SUBSTANCE,
];
