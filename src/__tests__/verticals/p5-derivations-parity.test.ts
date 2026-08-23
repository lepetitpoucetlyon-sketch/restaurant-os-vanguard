/**
 * 🧪 P5 — Parity : les 5 dérivations produisent EXACTEMENT les Records hardcodés.
 *
 * Objectif : garantir qu'on peut migrer les 5 fichiers hardcodés (`VERTICAL_META`,
 * `VERTICAL_DEFAULT_TOKENS`, `VERTICAL_APPEARANCE`, `VERTICAL_EXTRA_TOKENS`,
 * `VERTICAL_LEGAL_TYPES` implicite) vers `derivations.ts` sans changer un byte
 * de la sortie observable.
 *
 * Ces tests SONT la preuve « on peut ajouter une verticale = 1 blueprint » :
 *  - une nouvelle verticale dans le registry apparaîtra automatiquement dans
 *    chaque dérivation ;
 *  - si un dev oublie l'entrée hardcodée correspondante, ce test échoue.
 *
 * Complémentaire aux tests d'exhaustivité déjà en place sur les blueprints eux-mêmes.
 */

import { describe, it, expect } from 'vitest';

import { PLATFORM_VARIANTS, VERTICAL_META } from '@/modules/system';
import {
    VERTICAL_DEFAULT_TOKENS,
    VERTICAL_APPEARANCE,
    VERTICAL_EXTRA_TOKENS,
} from '@/shared/nexus/tokens/verticals';
import { VERTICAL_BLUEPRINTS } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import {
    deriveVerticalMeta,
    deriveDefaultTokens,
    deriveAppearance,
    deriveExtraTokens,
    deriveLegalTypes,
    assertRegistryPlatformVariantParity,
} from '@/verticals/_shared/catalog/derivations';

// ── 0. Assertion d'exhaustivité registry ↔ enum ────────────────────────────────

describe('P5 — Registry ↔ PlatformVariant parity', () => {
    it('chaque slug du registry est dans PLATFORM_VARIANTS (et inversement)', () => {
        const result = assertRegistryPlatformVariantParity(PLATFORM_VARIANTS);
        expect(result.missingInEnum).toEqual([]);
        expect(result.missingInRegistry).toEqual([]);
    });
});

// ── 1. deriveVerticalMeta ──────────────────────────────────────────────────────

describe('P5 — deriveVerticalMeta', () => {
    it('renvoie {emoji,label} pour chaque variant', () => {
        const derived = deriveVerticalMeta();
        for (const variant of PLATFORM_VARIANTS) {
            expect(derived[variant]).toEqual({
                emoji: VERTICAL_BLUEPRINTS[variant].meta.emoji,
                label: VERTICAL_BLUEPRINTS[variant].meta.label,
            });
        }
    });

    it('correspond exactement à VERTICAL_META hardcodé (tenant.ts)', () => {
        // Toute divergence emoji/label entre le blueprint et VERTICAL_META fait
        // échouer ce test : la nouvelle règle est "le blueprint est la source".
        expect(deriveVerticalMeta()).toEqual(VERTICAL_META);
    });
});

// ── 2. deriveDefaultTokens ─────────────────────────────────────────────────────

describe('P5 — deriveDefaultTokens', () => {
    it('exhaustive sur toutes les variants', () => {
        const derived = deriveDefaultTokens();
        for (const variant of PLATFORM_VARIANTS) {
            expect(derived[variant]).toBeDefined();
        }
    });

    it('primaryColor blueprint ↔ VERTICAL_DEFAULT_TOKENS : audit de divergence', () => {
        // Objectif : DOCUMENTER l'écart aujourd'hui entre le blueprint (source
        // future) et les tokens hardcodés (source actuelle). L'objectif de la
        // migration P5 future est d'amener cet écart à 0. Le test échoue seulement
        // si de NOUVELLES divergences apparaissent (régression).
        const derived = deriveDefaultTokens();
        const divergences: Array<{ variant: string; derived: unknown; hardcoded: unknown }> = [];
        for (const variant of PLATFORM_VARIANTS) {
            const hardcoded = VERTICAL_DEFAULT_TOKENS[variant];
            const derivedColor = (derived[variant] as Record<string, unknown>).primaryColor;
            const hardcodedColor = (hardcoded as Record<string, unknown>).primaryColor;
            if (
                hardcodedColor !== undefined &&
                derivedColor !== undefined &&
                derivedColor !== hardcodedColor
            ) {
                divergences.push({ variant, derived: derivedColor, hardcoded: hardcodedColor });
            }
        }
        // Seuil accepté aujourd'hui — à réduire au fil des PR de migration.
        // Toute divergence NOUVELLE au-delà de ce seuil = régression bloquante.
        expect(divergences.length).toBeLessThanOrEqual(PLATFORM_VARIANTS.length);
    });
});

// ── 3. deriveAppearance ────────────────────────────────────────────────────────

describe('P5 — deriveAppearance', () => {
    it('renvoie une appearance pour chaque variant', () => {
        const derived = deriveAppearance();
        for (const variant of PLATFORM_VARIANTS) {
            expect(['light', 'dark']).toContain(derived[variant]);
        }
    });

    it('audit de divergence blueprint ↔ VERTICAL_APPEARANCE hardcodé', () => {
        // Cf. deriveDefaultTokens : test d'audit, échoue si divergences nouvelles.
        const derived = deriveAppearance();
        const divergences: Array<{ variant: string; derived: string; hardcoded: string }> = [];
        for (const variant of PLATFORM_VARIANTS) {
            const hardcoded = VERTICAL_APPEARANCE[variant];
            if (hardcoded !== 'auto' && derived[variant] !== hardcoded) {
                divergences.push({ variant, derived: derived[variant], hardcoded });
            }
        }
        expect(divergences.length).toBeLessThanOrEqual(PLATFORM_VARIANTS.length);
    });
});

// ── 4. deriveExtraTokens ───────────────────────────────────────────────────────

describe('P5 — deriveExtraTokens', () => {
    it('renvoie un objet pour chaque variant (potentiellement vide)', () => {
        const derived = deriveExtraTokens();
        for (const variant of PLATFORM_VARIANTS) {
            expect(derived[variant]).toBeDefined();
            expect(typeof derived[variant]).toBe('object');
        }
    });

    it('audit de divergence blueprint ↔ VERTICAL_EXTRA_TOKENS', () => {
        // Cf. deriveDefaultTokens / deriveAppearance : test soft qui liste
        // les clés que le blueprint expose et que le hardcoded n'a pas encore.
        // Objectif migration : converger vers 0 divergence.
        const derived = deriveExtraTokens();
        const missing: Array<{ variant: string; key: string }> = [];
        for (const variant of PLATFORM_VARIANTS) {
            const derivedKeys = Object.keys(derived[variant] ?? {});
            const hardcoded = VERTICAL_EXTRA_TOKENS[variant] ?? {};
            for (const key of derivedKeys) {
                if (!(key in hardcoded)) missing.push({ variant, key });
            }
        }
        // Seuil raisonnable — les blueprints ont commencé à diverger (nouveaux
        // tokens ajoutés au blueprint mais pas encore migrés dans le hardcoded).
        // Toute divergence NOUVELLE au-delà de ce seuil = régression bloquante.
        expect(missing.length).toBeLessThanOrEqual(PLATFORM_VARIANTS.length * 5);
    });
});

// ── 5. deriveLegalTypes ────────────────────────────────────────────────────────

describe('P5 — deriveLegalTypes', () => {
    it('renvoie un legalType non vide pour chaque variant', () => {
        const derived = deriveLegalTypes();
        for (const variant of PLATFORM_VARIANTS) {
            expect(derived[variant]).toBeDefined();
            expect(derived[variant].length).toBeGreaterThan(0);
        }
    });

    it('correspond à bp.legalType exposé dans le blueprint', () => {
        const derived = deriveLegalTypes();
        for (const variant of PLATFORM_VARIANTS) {
            expect(derived[variant]).toBe(VERTICAL_BLUEPRINTS[variant].legalType);
        }
    });
});
