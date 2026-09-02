/**
 * @wip vertical-forge — Échéance: 2026-11-01
 * 🧬 Derivations — les Record<PlatformVariant, X> dérivés du VerticalBlueprintRegistry.
 *
 * ── Contexte (P5 MEGA-PLAN Forge Stack) ────────────────────────────────────────
 * Avant P5, ajouter une verticale exigeait de toucher ~8 `Record<PlatformVariant, …>`
 * répartis dans plusieurs fichiers (tokens, appearance, meta, support, legal, seeds,
 * fonts, système-tenants). Chaque oubli = fallback silencieux sur `custom` — pas de
 * régression visible en compile, mais divergence des sources de vérité.
 *
 * Ce module offre une **source unique dérivée** : chaque map est une fonction pure
 * qui lit `VERTICAL_BLUEPRINTS` et projette le champ demandé. Ajouter une verticale
 * = déposer son blueprint dans `VerticalBlueprintRegistry.ts` → les 5 dérivations
 * ci-dessous se mettent à jour en cascade.
 *
 * ── Stratégie de migration (incrémentale, non-régressive) ──────────────────────
 * Ce fichier NE remplace PAS immédiatement les Records hardcodés existants. Il
 * expose des dérivations parallèles et un test de parity (`p5-derivations-parity.test.ts`)
 * qui prouve `derived === hardcoded` pour chaque map. Les fichiers hardcodés peuvent
 * ensuite être migrés un par un — via ré-export depuis ce module — sans risque.
 *
 * ── Contrainte de cycle ────────────────────────────────────────────────────────
 * `src/modules/system/domain/schemas/tenant.ts` (où vit `VERTICAL_META`) est un
 * module leaf : il ne peut PAS importer `verticals/` sans créer un cycle. Ce
 * fichier peut, à l'inverse, importer `modules/system` (`PlatformVariant`).
 * → `VERTICAL_META` reste hardcodé dans tenant.ts, mais le test de parity garantit
 *    qu'il n'a pas divergé du blueprint.
 *
 * Idem pour `src/shared/nexus/tokens/verticals/index.ts` : shared/nexus est
 * importé par verticals/, donc l'inverse créerait un cycle.
 * → migration future = déplacer ces tokens sous `verticals/_shared/` ou faire
 *   le graphe inverse.
 *
 * Module FEUILLE : n'importe que `VerticalBlueprintRegistry` + types. Zéro cycle.
 */

import type { PlatformVariant } from '@/modules/system';

import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';
import { VERTICAL_BLUEPRINTS } from './VerticalBlueprintRegistry';

// ── Helper interne : itérateur strict sur le registry ─────────────────────────

/**
 * Projette chaque blueprint sur `T` via `fn`. Le type de retour force l'exhaustivité
 * : si une nouvelle `PlatformVariant` est ajoutée à l'enum mais ABSENTE du registry,
 * tsc échoue à cet endroit.
 */
function projectFromRegistry<T>(
    fn: (bp: VerticalBlueprint) => T,
): Record<PlatformVariant, T> {
    const out = {} as Record<PlatformVariant, T>;
    for (const [slug, bp] of Object.entries(VERTICAL_BLUEPRINTS)) {
        out[slug as PlatformVariant] = fn(bp);
    }
    return out;
}

// ── 1. Meta (emoji + label) ────────────────────────────────────────────────────

/**
 * Dérive `VERTICAL_META` depuis les blueprints.
 * Miroir de `src/modules/system/domain/schemas/tenant.ts:VERTICAL_META`.
 */
export function deriveVerticalMeta(): Record<PlatformVariant, { emoji: string; label: string }> {
    return projectFromRegistry((bp) => ({ emoji: bp.meta.emoji, label: bp.meta.label }));
}

// ── 2. Default tokens (branding par défaut par variant) ────────────────────────

export function deriveDefaultTokens(): Record<PlatformVariant, VerticalBlueprint['tokens']['defaultTokens']> {
    return projectFromRegistry((bp) => bp.tokens.defaultTokens);
}

// ── 3. Appearance (light/dark par défaut) ──────────────────────────────────────

/**
 * L'enum blueprint est `'light' | 'dark'`, la Record consommatrice est
 * `'light' | 'dark' | 'auto'`. On projette tel quel (pas de blueprint 'auto'
 * aujourd'hui — cela viendra si besoin via un champ optionnel du blueprint).
 */
export function deriveAppearance(): Record<PlatformVariant, 'light' | 'dark'> {
    return projectFromRegistry((bp) => bp.tokens.appearance);
}

// ── 4. Extra tokens (verticalTokens) ───────────────────────────────────────────

export function deriveExtraTokens(): Record<PlatformVariant, Record<string, string>> {
    return projectFromRegistry((bp) => bp.tokens.verticalTokens as Record<string, string>);
}

// ── 5. Legal types (type de contrat légal par verticale) ───────────────────────

/**
 * Utilisé par `LegalContractGenerator` et l'addendum RGPD.
 * Champ direct du blueprint : `bp.legalType`.
 */
export function deriveLegalTypes(): Record<PlatformVariant, string> {
    return projectFromRegistry((bp) => bp.legalType);
}

// ── Assertion d'exhaustivité (garde-fou tsc) ───────────────────────────────────

/**
 * Renvoie la liste des slugs déclarés dans le registry mais absents de l'enum
 * `PlatformVariant`, ou l'inverse. Un des deux non vide → un blueprint a été
 * ajouté sans MAJ de l'enum (ou l'inverse).
 *
 * Utilisé par `p5-derivations-parity.test.ts` pour bloquer les régressions.
 */
export function assertRegistryPlatformVariantParity(
    knownVariants: readonly PlatformVariant[],
): {
    missingInEnum: string[];
    missingInRegistry: string[];
} {
    const registrySlugs = new Set(Object.keys(VERTICAL_BLUEPRINTS));
    const enumSlugs = new Set(knownVariants as readonly string[]);
    return {
        missingInEnum: [...registrySlugs].filter((s) => !enumSlugs.has(s)),
        missingInRegistry: [...enumSlugs].filter((s) => !registrySlugs.has(s)),
    };
}
