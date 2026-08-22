/**
 * 🧪 CapabilityWiringRegistry — tests d'intégrité + agrégateurs.
 *
 * Objectifs :
 *  1. Exhaustivité : chaque capability du catalogue a une entrée dans le wiring.
 *  2. Résolution transitive des dépendances (ex. mod_kds → mod_pos).
 *  3. Agrégateurs : routes, guards, events consolident correctement.
 *  4. Contract seedData : idempotent, tolère les erreurs partielles.
 */

import { describe, it, expect, vi } from 'vitest';

import { CAPABILITY_KEYS, type CapabilityKey } from '@/verticals/_shared/catalog/CapabilityCatalog';
import {
    CAPABILITY_WIRING,
    getCapabilityWiring,
    routesForCapabilities,
    guardsForCapabilities,
    eventsForCapabilities,
    seedCapabilities,
    assertWiringExhaustiveness,
    assertWiringHardwareConsistency,
} from '@/verticals/_shared/catalog/CapabilityWiring';

// ── 1. Exhaustivité ─────────────────────────────────────────────────────────────

describe('Wiring — exhaustivité vs catalogue', () => {
    it('couvre toutes les capabilities du catalogue (aucune entrée manquante)', () => {
        const missing = assertWiringExhaustiveness();
        expect(missing).toEqual([]);
    });
    it('n\'a pas de conflit hardware (extraHardware ⊄ requiredHardware du catalogue)', () => {
        const conflicts = assertWiringHardwareConsistency();
        expect(conflicts).toEqual([]);
    });
    it('chaque entrée est un objet (peut être vide mais existant)', () => {
        for (const k of CAPABILITY_KEYS) {
            expect(typeof CAPABILITY_WIRING[k]).toBe('object');
            expect(CAPABILITY_WIRING[k]).not.toBeNull();
        }
    });
});

// ── 2. Résolution transitive ────────────────────────────────────────────────────

describe('Wiring — résolution des dépendances', () => {
    it('mod_kds implique automatiquement mod_pos dans les routes agrégées', () => {
        const routes = routesForCapabilities(['mod_kds']);
        const paths = routes.map(r => r.path);
        // mod_kds a une route /kds ; mod_pos a une route /pos → les deux doivent apparaître
        expect(paths).toContain('/kds');
        expect(paths).toContain('/pos');
    });
    it('guardsForCapabilities remonte le FiscalSealGuard via mod_pos', () => {
        const guards = guardsForCapabilities(['mod_kds']);
        expect(guards).toContain('FiscalSealGuard'); // porté par mod_pos, mod_kds en dépend
    });
    it('eventsForCapabilities agrège emits + listens sans doublons', () => {
        const { emits, listens } = eventsForCapabilities(['mod_kds']);
        expect(emits).toContain('ops.order_ready');   // émis par mod_kds
        expect(emits).toContain('finance.order_sealed'); // émis par mod_pos (dep)
        expect(listens).toContain('ops.order_created'); // écouté par mod_kds
        // pas de doublon
        expect(new Set(emits).size).toBe(emits.length);
        expect(new Set(listens).size).toBe(listens.length);
    });
});

// ── 3. Getters ──────────────────────────────────────────────────────────────────

describe('Wiring — getCapabilityWiring', () => {
    it('retourne le wiring exact d\'une capability connue', () => {
        const w = getCapabilityWiring('mod_pos');
        expect(w.module).toBe('@/modules/ops');
        expect(w.navSection).toBe('production');
        expect(w.routes?.[0].path).toBe('/pos');
    });
    it('retourne {} pour une capability sans wiring déclaré (transverse)', () => {
        // mod_brand_basic a `{ navSection: 'core' }` — donc pas totalement vide, mais pas de module
        const w = getCapabilityWiring('mod_brand_basic');
        expect(w.module).toBeUndefined();
        expect(w.routes).toBeUndefined();
    });
});

// ── 4. seedCapabilities — contrat ───────────────────────────────────────────────

describe('Wiring — seedCapabilities', () => {
    it('marque skipped les capabilities sans seedData (situation par défaut)', async () => {
        const result = await seedCapabilities(['mod_pos'], {
            tenantId: 't_test', variant: 'restaurant', activeCapabilities: ['mod_pos'],
        });
        // Aucun wiring n'a de seedData déclaré aujourd'hui → tout skipped, aucune erreur
        expect(result.seeded).toEqual([]);
        expect(result.errors).toEqual([]);
        expect(result.skipped).toContain('mod_pos');
    });

    it('appelle seedData quand présent et le passe en context complet', async () => {
        // Patch temporaire d'une entrée du wiring pour vérifier le contrat
        const original = CAPABILITY_WIRING['mod_analytics'];
        const spy = vi.fn(async () => { /* ok */ });
        (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_analytics'] = { ...original, seedData: spy };
        try {
            const result = await seedCapabilities(['mod_analytics'], {
                tenantId: 't_test', variant: 'gym', activeCapabilities: ['mod_analytics'],
            });
            expect(spy).toHaveBeenCalledTimes(1);
            const firstCall = spy.mock.calls[0] as unknown[];
            expect(firstCall[0]).toEqual({
                tenantId: 't_test', variant: 'gym', activeCapabilities: ['mod_analytics'],
            });
            expect(result.seeded).toContain('mod_analytics');
        } finally {
            (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_analytics'] = original;
        }
    });

    it('capture les erreurs partielles sans faire échouer les autres capabilities', async () => {
        const originalA = CAPABILITY_WIRING['mod_analytics'];
        const originalB = CAPABILITY_WIRING['mod_ai'];
        const okSpy = vi.fn(async () => { /* ok */ });
        const failSpy = vi.fn(async () => { throw new Error('boom'); });
        (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_analytics'] = { ...originalA, seedData: okSpy };
        (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_ai'] = { ...originalB, seedData: failSpy };
        try {
            const result = await seedCapabilities(['mod_analytics', 'mod_ai'], {
                tenantId: 't_test', variant: 'restaurant', activeCapabilities: ['mod_analytics', 'mod_ai'],
            });
            expect(result.seeded).toContain('mod_analytics');
            expect(result.errors).toEqual([{ key: 'mod_ai', error: 'boom' }]);
        } finally {
            (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_analytics'] = originalA;
            (CAPABILITY_WIRING as Record<CapabilityKey, unknown>)['mod_ai'] = originalB;
        }
    });
});
