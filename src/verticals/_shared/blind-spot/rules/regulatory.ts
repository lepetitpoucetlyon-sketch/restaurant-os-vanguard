/**
 * ⚖️ Règles d'angles morts — famille "regulatory".
 *
 * L'étude sectorielle ou le profil scrapé signale une obligation légale, mais
 * la configuration ne l'active pas. Non-conformité potentielle → severity haute.
 */

import type { BlindSpotRule, RuleOutput, VerticalContext, TenantContext } from '../types';

/** Test unifié : le study ou le catalogue mentionne-t-il un thème régulatoire ? */
function studyMentions(ctx: { study: VerticalContext['study'] }, patterns: readonly RegExp[]): string | null {
    for (const reg of ctx.study.regulations) {
        const corpus = `${reg.label} ${reg.description ?? ''} ${reg.reference ?? ''}`;
        for (const p of patterns) if (p.test(corpus)) return reg.label;
    }
    for (const wf of ctx.study.workflows) {
        const corpus = `${wf.label} ${wf.description ?? ''}`;
        for (const p of patterns) if (p.test(corpus)) return wf.label;
    }
    return null;
}

function catalogMentions(ctx: { companyProfile: TenantContext['companyProfile'] }, patterns: readonly RegExp[]): string | null {
    for (const it of ctx.companyProfile.catalog) {
        const corpus = `${it.name} ${it.description ?? ''} ${it.category ?? ''}`;
        for (const p of patterns) if (p.test(corpus)) return `${it.name} (${it.category})`;
    }
    return null;
}

// ── R.1 HACCP ────────────────────────────────────────────────────────────────────

export const HACCP_REQUIRED_BUT_OFF: BlindSpotRule = {
    id: 'bs.regulatory.haccp_missing',
    family: 'regulatory',
    scope: 'both',
    defaultTitle: 'HACCP requis par le secteur mais désactivé',
    detectVertical(ctx) {
        const found = studyMentions(ctx, [/haccp/i, /plan de maîtrise sanitaire/i, /allergène/i]);
        if (!found) return null;
        if (ctx.effectiveCapabilities['mod_haccp'] === true) return null;
        return output('critical',
            [`study.regulations/workflows mentionne HACCP : "${found}"`,
             `effectiveCapabilities.mod_haccp = ${ctx.effectiveCapabilities['mod_haccp']}`],
            'enable_capability', 'mod_haccp',
            'Cadre réglementaire du secteur — non-conformité pénale possible (Règlement (CE) 852/2004).');
    },
    detectTenant(ctx) {
        const foodEvidence = catalogMentions(ctx, [/plat|entrée|dessert|menu|salade|sandwich|viande|poisson/i]);
        if (!foodEvidence) return null;
        if (ctx.qualification.capabilities['mod_haccp'] === true) return null;
        return output('critical',
            [`catalogue extrait contient alimentation : "${foodEvidence}"`,
             `qualification.capabilities.mod_haccp = ${ctx.qualification.capabilities['mod_haccp']}`],
            'enable_capability', 'mod_haccp',
            'Vente de produits alimentaires → PMS/HACCP obligatoire.');
    },
};

// ── R.2 RGPD Art.9 (santé/biométrie) ─────────────────────────────────────────────

export const RGPD_SENSITIVE_DATA_BUT_OFF: BlindSpotRule = {
    id: 'bs.regulatory.rgpd_sensitive_missing',
    family: 'regulatory',
    scope: 'both',
    defaultTitle: 'Données sensibles (art.9 RGPD) traitées sans mod_rgpd',
    detectVertical(ctx) {
        const isHealth = ctx.blueprint.slug === 'clinic' || ctx.blueprint.slug === 'veterinary';
        if (!isHealth) return null;
        if (ctx.effectiveCapabilities['mod_rgpd'] === true) return null;
        return output('critical',
            [`blueprint.slug = ${ctx.blueprint.slug} → traite des données de santé`,
             `effectiveCapabilities.mod_rgpd = ${ctx.effectiveCapabilities['mod_rgpd']}`],
            'enable_capability', 'mod_rgpd',
            'Article 9 RGPD : les données de santé sont sensibles et exigent une base légale + PIA.');
    },
    detectTenant(ctx) {
        const isHealthVariant = ['clinic', 'veterinary'].includes(ctx.qualification.capabilities['mod_pos'] ? 'clinic' : '');
        const detected = ctx.companyProfile.sectorSignals.detectedVariant;
        if (!['clinic', 'veterinary'].includes(detected)) return null;
        if (ctx.qualification.capabilities['mod_rgpd'] === true) return null;
        void isHealthVariant;
        return output('critical',
            [`sectorSignals.detectedVariant = ${detected}`,
             `qualification.capabilities.mod_rgpd = ${ctx.qualification.capabilities['mod_rgpd']}`],
            'enable_capability', 'mod_rgpd',
            'Secteur santé → données sensibles + PIA obligatoire.');
    },
};

// ── R.3 Registre de sécurité incendie (ERP) ──────────────────────────────────────

export const ERP_FIRE_REGISTER_MISSING: BlindSpotRule = {
    id: 'bs.regulatory.erp_fire_register_missing',
    family: 'regulatory',
    scope: 'vertical',
    defaultTitle: 'ERP identifié sans registre sécurité incendie',
    detectVertical(ctx) {
        const receivesPublic = ['restaurant', 'hotel', 'gym', 'coworking', 'salon', 'clinic', 'veterinary'].includes(ctx.blueprint.slug);
        if (!receivesPublic) return null;
        const evidence = studyMentions(ctx, [/erp|jauge|incendie|baes|ssi/i]);
        if (!evidence) return null;
        if (ctx.effectiveCapabilities['mod_registre'] === true) return null;
        return output('high',
            [`blueprint.slug = ${ctx.blueprint.slug} (établissement recevant du public)`,
             `study mentionne : "${evidence}"`,
             `effectiveCapabilities.mod_registre = ${ctx.effectiveCapabilities['mod_registre']}`],
            'enable_capability', 'mod_registre',
            'ERP → registre sécurité incendie dématérialisé obligatoire (extincteurs, BAES, SSI).');
    },
};

// ── R.4 Convention collective (repos 11h) ────────────────────────────────────────

export const REST_PERIOD_GUARD_MISSING: BlindSpotRule = {
    id: 'bs.regulatory.rest_period_guard_missing',
    family: 'regulatory',
    scope: 'vertical',
    defaultTitle: 'mod_timeclock actif sans RestPeriodGuard',
    detectVertical(ctx) {
        if (ctx.effectiveCapabilities['mod_timeclock'] !== true) return null;
        // Le guard n'apparaît pas dans les blueprints existants (pas de champ dédié) —
        // on regarde si le study le mentionne ou si mod_hr est plein
        const mentionsRest = studyMentions(ctx, [/repos 11h|11 heures/i, /rest period|repos quotidien/i]);
        if (mentionsRest) {
            // Convention collective détectée → RestPeriodGuard attendu (via CapabilityWiring)
            return output('high',
                [`mod_timeclock = true`,
                 `study mentionne repos 11h : "${mentionsRest}"`,
                 `CapabilityWiring[mod_timeclock].guards devrait contenir RestPeriodGuard`],
                'add_guard', 'RestPeriodGuard',
                'Article L3131-1 : 11h de repos quotidien minimum — guard obligatoire pour bloquer les shifts illégaux.');
        }
        return null;
    },
};

// ── R.5 Traçabilité DLC / chaîne du froid ────────────────────────────────────────

export const DLC_TRACEABILITY_MISSING: BlindSpotRule = {
    id: 'bs.regulatory.dlc_traceability_missing',
    family: 'regulatory',
    scope: 'both',
    defaultTitle: 'Périssable détecté sans traçabilité DLC/HACCP',
    detectVertical(ctx) {
        const perishable = studyMentions(ctx, [/périssable|dlc|dluo|chaîne du froid|frais/i, /fefo|fifo/i]);
        if (!perishable) return null;
        const hasHaccp = ctx.effectiveCapabilities['mod_haccp'] === true;
        const hasInventory = ctx.effectiveCapabilities['mod_inventory'] === true;
        if (hasHaccp && hasInventory) return null;
        const missing = !hasHaccp ? 'mod_haccp' : 'mod_inventory';
        return output('high',
            [`study mentionne périssable : "${perishable}"`,
             `mod_haccp=${hasHaccp} · mod_inventory=${hasInventory}`],
            'enable_capability', missing,
            'Produits périssables → traçabilité DLC + décrémentation FEFO obligatoires.');
    },
    detectTenant(ctx) {
        const perishable = catalogMentions(ctx, [/frais|glace|surgelé|viande|poisson|fromage|yaourt|primeurs?|bouquet|fleur/i]);
        if (!perishable) return null;
        if (ctx.qualification.capabilities['mod_haccp'] === true && ctx.qualification.capabilities['mod_inventory'] === true) return null;
        const missing = ctx.qualification.capabilities['mod_haccp'] !== true ? 'mod_haccp' : 'mod_inventory';
        return output('high',
            [`catalogue contient produits périssables : "${perishable}"`,
             `mod_haccp=${ctx.qualification.capabilities['mod_haccp']} · mod_inventory=${ctx.qualification.capabilities['mod_inventory']}`],
            'enable_capability', missing,
            'Produits périssables → traçabilité + FEFO obligatoires.');
    },
};

// ── Helper ──────────────────────────────────────────────────────────────────────

function output(
    severity: 'critical' | 'high' | 'medium' | 'low',
    evidence: string[],
    kind: 'enable_capability' | 'raise_tier' | 'add_hardware' | 'add_guard' | 'add_route' | 'manual',
    target: string,
    rationale: string,
): RuleOutput {
    return {
        severity,
        evidence,
        suggestedFix: { kind, target, rationale },
    };
}

export const REGULATORY_RULES: readonly BlindSpotRule[] = [
    HACCP_REQUIRED_BUT_OFF,
    RGPD_SENSITIVE_DATA_BUT_OFF,
    ERP_FIRE_REGISTER_MISSING,
    REST_PERIOD_GUARD_MISSING,
    DLC_TRACEABILITY_MISSING,
];
