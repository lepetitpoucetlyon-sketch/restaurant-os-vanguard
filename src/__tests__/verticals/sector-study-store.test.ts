/**
 * 🧪 SectorStudyStore — persistance MCC des études sectorielles (P1).
 *
 * Couvre :
 *  - Génération déterministe du versionId (même étude, même timestamp → même id).
 *  - Round-trip persist → getLatest / getVersion.
 *  - Tri chronologique (dernière version = plus récente).
 *  - Détection auto source (baseline vs llm-enriched selon confidence).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';
import {
    persistSectorStudy,
    getSectorStudyVersion,
    getLatestSectorStudy,
    listSectorStudies,
    SectorStudyStore,
} from '@/verticals/_shared/sector-study/SectorStudyStore';

// ── Fake in-memory adapter ──────────────────────────────────────────────────────

interface InMemoryStore { data: Map<string, unknown>; }
function installFakeAdapter(): InMemoryStore {
    const store: InMemoryStore = { data: new Map() };
    const fake = {
        async set(path: string, data: unknown) { store.data.set(path, data); },
        async get<T>(path: string): Promise<T | null> { return (store.data.get(path) as T) ?? null; },
        async query<T>(collectionPath: string): Promise<T[]> {
            const prefix = collectionPath.endsWith('/') ? collectionPath : `${collectionPath}/`;
            const out: T[] = [];
            for (const [k, v] of store.data.entries()) {
                if (k.startsWith(prefix)) out.push(v as T);
            }
            return out;
        },
    };
    // Nexus.adapter est un singleton — on remplace en place pour ces tests.
    (Nexus as { adapter: unknown }).adapter = fake;
    return store;
}

function baseStudy(overrides: Partial<SectorStudy> = {}): SectorStudy {
    return {
        vertical: 'salon',
        summary: 'Étude test',
        workflows: [],
        regulations: [],
        hardware: [],
        kpis: [],
        businessRules: [],
        integrations: [],
        confidence: 0.5,
        ...overrides,
    };
}

// ── Tests ───────────────────────────────────────────────────────────────────────

describe('SectorStudyStore — versionId déterministe', () => {
    it('produit le même versionId pour la même étude à la même seconde', () => {
        const study = baseStudy();
        const at = new Date('2026-08-22T10:00:00Z');
        expect(SectorStudyStore._computeVersionId(study, at)).toBe(SectorStudyStore._computeVersionId(study, at));
    });
    it('produit des versionId différents pour des études différentes', () => {
        const at = new Date('2026-08-22T10:00:00Z');
        const a = SectorStudyStore._computeVersionId(baseStudy({ summary: 'A' }), at);
        const b = SectorStudyStore._computeVersionId(baseStudy({ summary: 'B' }), at);
        expect(a).not.toBe(b);
    });
    it('produit des versionId ordonnés chronologiquement (tri lexico OK)', () => {
        const s = baseStudy();
        const early = SectorStudyStore._computeVersionId(s, new Date('2026-01-01T00:00:00Z'));
        const late = SectorStudyStore._computeVersionId(s, new Date('2026-12-31T23:59:59Z'));
        expect(early < late).toBe(true);
    });
});

describe('SectorStudyStore — round-trip persist/get', () => {
    let store: InMemoryStore;
    beforeEach(() => { store = installFakeAdapter(); });

    it('persist + getSectorStudyVersion → même contenu', async () => {
        const persisted = await persistSectorStudy(baseStudy({ summary: 'Rendez-vous' }), {
            source: 'baseline',
            at: new Date('2026-08-22T10:00:00Z'),
        });
        expect(persisted.source).toBe('baseline');
        expect(persisted.slug).toBe('salon');
        const got = await getSectorStudyVersion('salon', persisted.versionId);
        expect(got).not.toBeNull();
        expect(got!.study.summary).toBe('Rendez-vous');
    });

    it('détecte source=llm-enriched quand confidence > 0.6', async () => {
        const persisted = await persistSectorStudy(baseStudy({ confidence: 0.9 }));
        expect(persisted.source).toBe('llm-enriched');
    });

    it('détecte source=baseline quand confidence <= 0.6', async () => {
        const persisted = await persistSectorStudy(baseStudy({ confidence: 0.5 }));
        expect(persisted.source).toBe('baseline');
    });

    it('getLatestSectorStudy retourne la version la plus récente', async () => {
        await persistSectorStudy(baseStudy({ summary: 'v1' }), { at: new Date('2026-01-01T00:00:00Z') });
        await persistSectorStudy(baseStudy({ summary: 'v2' }), { at: new Date('2026-06-01T00:00:00Z') });
        await persistSectorStudy(baseStudy({ summary: 'v3' }), { at: new Date('2026-12-01T00:00:00Z') });
        const latest = await getLatestSectorStudy('salon');
        expect(latest?.study.summary).toBe('v3');
    });

    it('getLatestSectorStudy retourne null si aucune étude', async () => {
        expect(await getLatestSectorStudy('inexistant')).toBeNull();
    });

    it('listSectorStudies retourne toutes les versions triées desc', async () => {
        await persistSectorStudy(baseStudy({ summary: 'v1' }), { at: new Date('2026-01-01T00:00:00Z') });
        await persistSectorStudy(baseStudy({ summary: 'v2' }), { at: new Date('2026-06-01T00:00:00Z') });
        const all = await listSectorStudies('salon');
        expect(all).toHaveLength(2);
        expect(all[0].study.summary).toBe('v2'); // plus récent en tête
        expect(all[1].study.summary).toBe('v1');
    });

    it('scope MCC : les études sont dans mcc/studies/{slug}/{versionId}', async () => {
        const persisted = await persistSectorStudy(baseStudy());
        const expectedPath = `mcc/studies/salon/${persisted.versionId}`;
        expect(store.data.has(expectedPath)).toBe(true);
        // Vérifie qu'aucune donnée n'a fuité vers tenants/
        for (const key of store.data.keys()) {
            expect(key.startsWith('tenants/')).toBe(false);
        }
    });
});

describe('SectorStudyStore — dégradation propre', () => {
    it('propage les erreurs de persistance', async () => {
        (Nexus as { adapter: unknown }).adapter = {
            async set() { throw new Error('nexus down'); },
            async get() { return null; },
            async query() { return []; },
        };
        await expect(persistSectorStudy(baseStudy())).rejects.toThrow(/nexus down/);
    });

    it('retourne [] si query échoue (log-and-continue)', async () => {
        (Nexus as { adapter: unknown }).adapter = {
            async set() { /* ok */ },
            async get() { return null; },
            async query() { throw new Error('boom'); },
        };
        const suppressed = vi.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });
        try {
            expect(await listSectorStudies('salon')).toEqual([]);
            expect(await getLatestSectorStudy('salon')).toBeNull();
        } finally {
            suppressed.mockRestore();
        }
    });
});
