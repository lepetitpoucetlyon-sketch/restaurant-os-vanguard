/**
 * 🗺️ VerticalBlueprint — la spec DÉCLARATIVE d'une verticale (plan de montage)
 *
 * Une verticale n'est plus décrite par ~20 fichiers écrits à la main mais par UN
 * Blueprint. Le générateur (scripts/forge-vertical.ts) le lit et émet toute
 * l'arborescence ; l'Agent d'Étude de Secteur le remplit de substance.
 *
 * Deux dimensions clés de la vision :
 *  - `precision` (L0→L3) : dose la profondeur produite par le générateur.
 *  - `subVariants` : variantes intra-verticale (restaurant → brunch vs gastronomique),
 *    exprimées comme deltas sur la base — zéro duplication.
 *
 * Module de composition (importe le catalogue, les profils, SectorStudy, BrandConfig).
 * N'est PAS importé par `@/modules/system` → pas de cycle avec l'enum PlatformVariant.
 */

import type { BrandConfig } from '@/shared/nexus/tokens/brand';
import type { VerticalAIPrompts } from '@/kernel/ai/core/types';
import {
    type CapabilityKey,
    type CapabilitySet,
    type HardwareKind,
    isKnownCapability,
    resolveCapabilityDependencies,
} from '../catalog/CapabilityCatalog';
import { type ProfileId, profileCapabilities } from '../catalog/ProfileArchetype';
import { type SectorStudy, type SectorStudyDelta, mergeSectorStudy } from './SectorStudy';
import type { KickerDomain } from '@/shared/seeds/kickers';

/**
 * Tiers de précision — pilotent ce que le générateur produit :
 *  L0 squelette : plugin + index + enregistrement registry (fallback custom actif).
 *  L1 câblé     : + adapters via factories + tokens + DNA + tenants système + nav/ICM.
 *  L2 riche     : + composants métier, domain/types, features issues de la substance.
 *  L3 certifié  : + tests unit/E2E, hardware provisioning, addendum légal câblé.
 */
export type PrecisionTier = 'L0' | 'L1' | 'L2' | 'L3';

export const PRECISION_ORDER: readonly PrecisionTier[] = ['L0', 'L1', 'L2', 'L3'];

/** Vrai si `tier` atteint ou dépasse `min` (ex. atLeast('L2','L1') === true). */
export function precisionAtLeast(tier: PrecisionTier, min: PrecisionTier): boolean {
    return PRECISION_ORDER.indexOf(tier) >= PRECISION_ORDER.indexOf(min);
}

export interface BlueprintRoute {
    path: string;
    label: string;
    icon?: string;
    roles?: readonly string[];
    /** Chemin d'import relatif à la racine de la verticale (ex. './commerce/AppointmentCalendar'). */
    componentPath: string;
    /** Export nommé du composant (défaut : export nommé homonyme du fichier). */
    componentExport?: string;
}

/** Un event métier propre à la verticale, émis par un adapter de pilier. */
export interface BlueprintEvent {
    name: string;
    pillar: string;
    durable?: boolean;
    description?: string;
}

/** Overrides ciblés du DNA seed généré. */
export interface BlueprintDnaOverrides {
    layoutType?: string;
    basePrice?: number;
    businessLaws?: Record<string, string | number | boolean>;
    metadataName?: string;
}

export interface BlueprintTokens {
    defaultTokens: Partial<BrandConfig>;
    verticalTokens: Record<string, string>;
    appearance: 'light' | 'dark';
}

/**
 * Segment d'un `BlueprintHeader` — un rail de choix mutuellement exclusifs
 * (view=day/week, section=plan/clients/…). Généré comme un `PageShell.Segmented`.
 */
export interface BlueprintHeaderSegment {
    readonly name: string;                 // ex. 'view' → prop `view` + setter `setView`
    readonly ariaLabel: string;
    readonly items: readonly {
        readonly value: string;
        readonly label: string;
        readonly icon?: string;            // export name lucide-react
    }[];
}

/** CTA solitaire d'un `BlueprintHeader`. Généré comme un `PageShell.CTA`. */
export interface BlueprintHeaderCTA {
    readonly name: string;                 // ex. 'onNewReservation'
    readonly label: string;
    readonly icon?: string;
    readonly tone?: 'primary' | 'ghost' | 'danger';
}

/**
 * Un header entièrement DÉCLARATIF d'une page opérationnelle de la verticale.
 *
 * Consommé par le template forge `renderVerticalHeaders(input)` qui scaffolde
 * un tsx `src/verticals/<slug>/ui/<Name>.tsx` composé exclusivement des
 * primitives universelles `PageShell.OperationalHeader/EditorialTitle/Segmented/CTA`
 * — le kicker est piqué dans `KICKERS_BY_VARIANT` selon `(variant, domain)`.
 *
 * Voir ADR-017-vertical-headers.md.
 */
export interface BlueprintHeader {
    readonly name: string;                 // ex. 'MembersCheckoutHeader'
    readonly domain: KickerDomain;         // pilier universel (finance/commerce/…) ou emblématique
    readonly title: string;                // big-title Playfair
    readonly icon?: string;                // lucide subtile
    readonly titleSize?: 'sm' | 'md' | 'lg';
    readonly segments?: readonly BlueprintHeaderSegment[];
    readonly ctas?: readonly BlueprintHeaderCTA[];
    readonly dense?: boolean;              // 76px POS/KDS-like
}

/**
 * Sous-variante intra-verticale = deltas appliqués sur la base.
 * Ex. restaurant/brunch (service continu, pas de KDS lourd) vs
 *     restaurant/gastronomique (KDS, cave, réservation stricte, ticket élevé).
 */
export interface SubVariantBlueprint {
    slug: string;
    label: string;
    description?: string;
    /** Deltas capabilities (surcharge la base : true active, false désactive). */
    capabilities?: CapabilitySet;
    defaultTokens?: Partial<BrandConfig>;
    verticalTokens?: Record<string, string>;
    substanceDeltas?: SectorStudyDelta;
    dnaOverrides?: BlueprintDnaOverrides;
}

export interface VerticalBlueprint {
    /** Slug de la verticale (== futur PlatformVariant). */
    slug: string;
    /** Nom de la classe plugin (peut différer du slug : clinic → HealthVertical). */
    className: string;
    /** Profil archétypal (A–H) dont on hérite le socle de capabilities. */
    profile: ProfileId;
    meta: { emoji: string; label: string; name: string; description: string };
    /** Overrides de capabilities appliqués sur le socle du profil. */
    capabilities: CapabilitySet;
    tokens: BlueprintTokens;
    /** Forme des métriques du health ping MCC (clé → type), pour typer makeMccAdapter. */
    healthMetrics: Record<string, 'number' | 'boolean' | 'string'>;
    routes: readonly BlueprintRoute[];
    events: readonly BlueprintEvent[];
    hardware: readonly HardwareKind[];
    /**
     * Headers éditoriaux propres à la verticale. Scaffoldés par le forge dans
     * `src/verticals/<slug>/ui/` (skipIfExists) à partir des primitives
     * PageShell universelles. Facultatif : une verticale peut ne déclarer aucun
     * header custom et hériter du header par défaut d'une page host.
     */
    headers?: readonly BlueprintHeader[];
    /** Type légal (aligné LegalContractGenerator.VerticalType). */
    legalType: string;
    dnaOverrides?: BlueprintDnaOverrides;
    precision: PrecisionTier;
    subVariants?: readonly SubVariantBlueprint[];
    /** Substance sectorielle (Agent d'Étude) — requise pour L2/L3. */
    substance?: SectorStudy;
    /**
     * Bloc IA du blueprint — injecté automatiquement par PromptComposer (Layer 3).
     * Facultatif mais requis pour L2/L3 si l'assistant IA est activé.
     * R2 : Ce bloc est la SEULE manière d'injecter du vocabulaire vertical dans le kernel IA.
     */
    aiPrompts?: VerticalAIPrompts;
    /** Dépendances inter-piliers déclarées par le plugin (defaut : dérivées des capabilities). */
    dependencies?: readonly string[];
}

// ── Résolveurs ──────────────────────────────────────────────────────────────────

/**
 * Capabilities EFFECTIVES = socle du profil (tout à true) surchargé par les
 * overrides du blueprint, puis dépendances transitives ré-activées.
 */
export function resolveBlueprintCapabilities(bp: Pick<VerticalBlueprint, 'profile' | 'capabilities'>): CapabilitySet {
    const result: CapabilitySet = {};
    for (const k of profileCapabilities(bp.profile)) result[k] = true;
    Object.assign(result, bp.capabilities);
    // Ré-active les dépendances des capabilities laissées actives.
    const active = (Object.keys(result) as CapabilityKey[]).filter(k => result[k]);
    for (const dep of resolveCapabilityDependencies(active)) result[dep] = true;
    return result;
}

/** Piliers effectivement dépendus, dérivés des capabilities actives (pour IVerticalPlugin.dependencies). */
export function deriveDependencies(bp: Pick<VerticalBlueprint, 'profile' | 'capabilities' | 'dependencies'>): string[] {
    if (bp.dependencies) return [...bp.dependencies];
    return ['finance', 'commerce', 'compliance']; // socle minimal universel
}

/**
 * Aplati une sous-variante en un blueprint concret (base + deltas fusionnés).
 * Le résultat n'a plus de sous-variantes.
 */
export function resolveSubVariant(bp: VerticalBlueprint, subSlug: string): VerticalBlueprint {
    const sv = bp.subVariants?.find(s => s.slug === subSlug);
    if (!sv) throw new Error(`[Blueprint] sous-variante "${subSlug}" absente de "${bp.slug}"`);
    return {
        ...bp,
        slug: `${bp.slug}_${sv.slug}`,
        className: `${bp.className.replace(/Vertical$/, '')}${capitalize(sv.slug)}Vertical`,
        meta: {
            ...bp.meta,
            label: `${bp.meta.label} — ${sv.label}`,
            name: `${bp.meta.name} (${sv.label})`,
            description: sv.description ?? bp.meta.description,
        },
        capabilities: { ...bp.capabilities, ...sv.capabilities },
        tokens: {
            appearance: bp.tokens.appearance,
            defaultTokens: { ...bp.tokens.defaultTokens, ...sv.defaultTokens },
            verticalTokens: { ...bp.tokens.verticalTokens, ...sv.verticalTokens },
        },
        dnaOverrides: { ...bp.dnaOverrides, ...sv.dnaOverrides },
        substance: bp.substance && sv.substanceDeltas
            ? mergeSectorStudy(bp.substance, sv.substanceDeltas, sv.slug)
            : bp.substance,
        subVariants: undefined,
    };
}

/** Contrôles de cohérence d'un blueprint avant génération (retourne les problèmes). */
export function validateBlueprint(bp: VerticalBlueprint): string[] {
    const issues: string[] = [];
    if (!bp.slug || !/^[a-z][a-z0-9_]*$/.test(bp.slug)) issues.push(`slug invalide: "${bp.slug}"`);
    if (!/Vertical$/.test(bp.className)) issues.push(`className doit finir par "Vertical": "${bp.className}"`);
    for (const k of Object.keys(bp.capabilities)) {
        if (!isKnownCapability(k)) issues.push(`capability inconnue: "${k}"`);
    }
    if (!bp.legalType) issues.push('legalType manquant');
    if (precisionAtLeast(bp.precision, 'L2') && !bp.substance) {
        issues.push('substance (SectorStudy) requise pour precision ≥ L2');
    }
    for (const sv of bp.subVariants ?? []) {
        for (const k of Object.keys(sv.capabilities ?? {})) {
            if (!isKnownCapability(k)) issues.push(`sous-variante ${sv.slug}: capability inconnue "${k}"`);
        }
    }
    return issues;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
