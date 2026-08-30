/**
 * 🕵️ BlindSpotDetector — auditeur automatique de complétude métier (§C.9).
 *
 * Après que chaque agent a produit sa collecte (SectorStudy pour Axe A,
 * CompanyProfile + QualificationProfile pour Axe B), ce détecteur lit CE QUI A
 * ÉTÉ RÉCOLTÉ ET CE QUI A ÉTÉ PROPOSÉ, puis rapporte CE QUI DEVRAIT ÊTRE LÀ
 * MAIS NE L'EST PAS.
 *
 * Ne modifie rien : rapporte avec `severity` + `evidence` + `suggestedFix`.
 * L'opérateur décide (human-in-the-loop, comme le reste de la stack).
 *
 * Design :
 *  - Chaque règle = fonction PURE (aucune I/O, aucun LLM, testable en isolation).
 *  - Registre extensible : nouvelle loi/pratique → nouvelle règle en 20 lignes.
 *  - REJOUABLE sur un tenant existant : quand une règle est ajoutée demain,
 *    on peut détecter les gaps rétroactivement sans re-scrape.
 *
 * Module FEUILLE : n'importe que les contrats blueprint / catalogue / schémas
 * onboarding. Aucun cycle possible.
 */

import type { VerticalBlueprint } from '../blueprint/VerticalBlueprint';
import type { SectorStudy } from '../blueprint/SectorStudy';
import type { CompanyProfile } from '@/modules/commerce';
import { resolveBlueprintCapabilities } from '../blueprint/VerticalBlueprint';
import { DEFAULT_RULES } from './rules';

import type {
    Severity,
    BlindSpot,
    BlindSpotReport,
    VerticalContext,
    TenantContext,
    RuleOutput,
    BlindSpotRule,
} from './types';

export type {
    Severity,
    BlindSpotFamily,
    SuggestedFix,
    BlindSpot,
    BlindSpotReport,
    VerticalContext,
    TenantContext,
    RuleScope,
    RuleOutput,
    BlindSpotRule,
} from './types';

// ── Runner ──────────────────────────────────────────────────────────────────────

/**
 * Fabrique un `BlindSpotReport` à partir d'une liste de règles + un scope + un contexte.
 * Runner unique pour vertical/tenant — la sélection des règles applicables se fait
 * via `rule.scope`.
 */
export function runBlindSpotRules(
    rules: readonly BlindSpotRule[],
    scope: 'vertical' | 'tenant',
    ctx: VerticalContext | TenantContext,
    at: Date = new Date(),
): BlindSpotReport {
    const applicable = rules.filter(r => r.scope === scope || r.scope === 'both');
    const triggered: BlindSpot[] = [];

    for (const rule of applicable) {
        let out: RuleOutput | null = null;
        try {
            if (scope === 'vertical' && rule.detectVertical) {
                out = rule.detectVertical(ctx as VerticalContext);
            } else if (scope === 'tenant' && rule.detectTenant) {
                out = rule.detectTenant(ctx as TenantContext);
            }
        } catch {
            // Une règle qui lève ne casse pas l'audit — on la considère silencieuse
            out = null;
        }
        if (!out) continue;
        triggered.push({
            id: rule.id,
            family: rule.family,
            severity: out.severity,
            title: out.title ?? rule.defaultTitle,
            evidence: out.evidence,
            suggestedFix: out.suggestedFix,
        });
    }

    const summary: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const bs of triggered) summary[bs.severity] += 1;

    // Tri : critical d'abord, puis high, medium, low ; à égalité, tri par id (stable/testable)
    const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    triggered.sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));

    return {
        scannedAt: at.toISOString(),
        scope,
        totalRulesRun: applicable.length,
        triggered,
        summary,
    };
}

// ── Orchestrateurs de haut niveau ───────────────────────────────────────────────

/**
 * Audit d'une verticale (Axe A). L'appelant fournit blueprint + étude ; le
 * détecteur calcule les capabilities effectives et lance toutes les règles
 * scope 'vertical' ou 'both' du registre par défaut.
 */
export function detectVerticalBlindSpots(input: {
    blueprint: VerticalBlueprint;
    study: SectorStudy;
    /** Registre personnalisé — défaut : DEFAULT_RULES du module rules/. */
    rules?: readonly BlindSpotRule[];
    at?: Date;
}): BlindSpotReport {
    const effectiveCapabilities = resolveBlueprintCapabilities(input.blueprint);
    const ctx: VerticalContext = { blueprint: input.blueprint, study: input.study, effectiveCapabilities };
    // Aucun cycle : les modules `rules/*.ts` n'importent que des types depuis ce fichier.
    const rules = input.rules ?? DEFAULT_RULES;
    return runBlindSpotRules(rules, 'vertical', ctx, input.at);
}

/**
 * Audit d'un tenant (Axe B). L'appelant fournit companyProfile + qualification
 * (P2a) + étude sectorielle du variant. Lance les règles scope 'tenant' ou 'both'.
 */
export function detectTenantBlindSpots(input: {
    companyProfile: CompanyProfile;
    qualification: TenantContext['qualification'];
    study: SectorStudy;
    rules?: readonly BlindSpotRule[];
    at?: Date;
}): BlindSpotReport {
    const ctx: TenantContext = { companyProfile: input.companyProfile, qualification: input.qualification, study: input.study };
    const rules = input.rules ?? DEFAULT_RULES;
    return runBlindSpotRules(rules, 'tenant', ctx, input.at);
}
