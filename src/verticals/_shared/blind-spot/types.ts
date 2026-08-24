/**
 * 🕵️ Types purs pour BlindSpotDetector et ses règles.
 *
 * Découplé pour éliminer les cycles de dépendances entre BlindSpotDetector et rules/*.
 */

import type { CapabilitySet, HardwareKind } from '../catalog/CapabilityCatalog';
import type { VerticalBlueprint } from '../blueprint/VerticalBlueprint';
import type { SectorStudy } from '../blueprint/SectorStudy';
import type { CompanyProfile } from '@/modules/commerce';

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

/** Contexte fourni aux règles tenant (Axe B). */
export interface TenantContext {
    readonly companyProfile: CompanyProfile;
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
