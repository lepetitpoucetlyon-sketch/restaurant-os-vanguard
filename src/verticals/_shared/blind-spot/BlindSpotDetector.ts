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

import type { CapabilitySet, HardwareKind } from '../catalog/CapabilityCatalog';
import type { VerticalBlueprint } from '../blueprint/VerticalBlueprint';
import type { SectorStudy } from '../blueprint/SectorStudy';
import type { CompanyProfile } from '@/modules/commerce';
import { resolveBlueprintCapabilities } from '../blueprint/VerticalBlueprint';
import { DEFAULT_RULES } from './rules';

// ── Contrats publics ────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type BlindSpotFamily =
    | 'regulatory'              // études régule un truc, mais capability/guard off
    | 'scale_tier_mismatch'     // signaux disent gros, tier propose petit
    | 'catalog_capability'      // catalogue révèle un besoin, capability off
    | 'hardware'                // hardware impliqué, blueprint ne le liste pas
    | 'guards'                  // capability critique sans son guard
    | 'dependency_cascade'      // violation de dependsOn
    | 'route_ui'                // capability ON sans route → invisible
    | 'tier_completeness';      // tier haut sans les modules attendus

export interface SuggestedFix {
    readonly kind: 'enable_capability' | 'raise_tier' | 'add_hardware' | 'add_guard' | 'add_route' | 'manual';
    /** Cible technique (capability key, tier level, hardware kind, guard name…) */
    readonly target?: string;
    readonly rationale: string;
}

export interface BlindSpot {
    /** ID stable, format `bs.<family>.<slug>` pour tri et déduplication. */
    readonly id: string;
    readonly family: BlindSpotFamily;
    readonly severity: Severity;
    readonly title: string;
    readonly evidence: readonly string[];
    readonly suggestedFix: SuggestedFix;
}

export interface BlindSpotReport {
    readonly scannedAt: string;                 // ISO
    readonly scope: 'vertical' | 'tenant';
    readonly totalRulesRun: number;
    readonly triggered: readonly BlindSpot[];
    readonly summary: Record<Severity, number>;
}

/** Contexte fourni aux règles verticale (Axe A). */
export interface VerticalContext {
    readonly blueprint: VerticalBlueprint;
    readonly study: SectorStudy;
    /** Capabilities effectives (blueprint + héritage profile + deps). */
    readonly effectiveCapabilities: CapabilitySet;
}

/** Contexte fourni aux règles tenant (Axe B). Placeholder pour QualificationProfile P2a. */
export interface TenantContext {
    readonly companyProfile: CompanyProfile;
    /** Placeholder — sera typé QualificationProfile en P2a. */
    readonly qualification: {
        readonly recommendedTier: 'L0' | 'L1' | 'L2' | 'L3';
        readonly capabilities: CapabilitySet;
        readonly hardware: readonly HardwareKind[];
    };
    readonly study: SectorStudy;
}

/** Une règle s'applique à un scope ('vertical' | 'tenant' | 'both'). */
export type RuleScope = 'vertical' | 'tenant' | 'both';

/**
 * Signature d'une règle : reçoit un contexte, retourne un `BlindSpot` sans son id
 * ni son family (injectés par le runner depuis le registre) ou `null` si le
 * signal n'est pas déclenché.
 */
export type RuleOutput = Pick<BlindSpot, 'severity' | 'evidence' | 'suggestedFix'> & {
    readonly title?: string;
};

export interface BlindSpotRule {
    readonly id: string;
    readonly family: BlindSpotFamily;
    readonly scope: RuleScope;
    readonly defaultTitle: string;
    detectVertical?(ctx: VerticalContext): RuleOutput | null;
    detectTenant?(ctx: TenantContext): RuleOutput | null;
}

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
