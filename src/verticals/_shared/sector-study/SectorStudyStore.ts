/**
 * @wip vertical-forge — Échéance: 2026-11-01
 * 🗄️ SectorStudyStore — persistance MCC des études sectorielles.
 *
 * Rôle : versionner et exposer les `SectorStudy` produites par `runSectorStudy`
 * pour que 3 consommateurs puissent les relire :
 *  - `StudyToBlueprintCompiler` (P3, à venir) — étude → Blueprint (Axe A).
 *  - `QualificationEngine` (P2, à venir) — étude + `CompanyProfile` → réponses 7 axes.
 *  - UI MCC — visualisation de l'étude, comparaison de versions.
 *
 * Emplacement : `mcc/studies/{slug}/{versionId}` (scope MCC, JAMAIS tenant).
 * Rationale : une étude sectorielle est mutualisée entre TOUS les tenants du
 * secteur — pas de fuite cross-tenant possible puisque ce n'est pas dans
 * `tenants/{tenantId}/`.
 *
 * Module FEUILLE : n'importe que le contrat SectorStudy et l'adapter Nexus.
 */

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import type { SectorStudy } from '../blueprint/SectorStudy';

/**
 * Enveloppe d'une étude persistée : la substance + son métadonnées de version.
 * `versionId` = timestamp UTC + hash court pour tri chronologique + unicité.
 */
export interface PersistedSectorStudy {
    readonly versionId: string;
    readonly slug: string;
    readonly subVariant?: string;
    readonly createdAt: string;
    /** Source de génération : 'baseline' (déterministe) ou 'llm-enriched'. */
    readonly source: 'baseline' | 'llm-enriched';
    /** Auteur MCC (opérateur / agent) — sert d'audit trail. */
    readonly authorId?: string;
    readonly study: SectorStudy;
}

/** Base path scope MCC. */
const BASE_PATH = 'mcc/studies';

/**
 * Version ID monotone : `YYYYMMDDHHMMSS-XXXX` où XXXX = 4 chars hex de l'hash
 * du contenu. Tri lexicographique = tri chronologique.
 */
function computeVersionId(study: SectorStudy, at: Date): string {
    const iso = at.toISOString();
    const stamp = iso.replace(/[-:T.Z]/g, '').slice(0, 14);
    // Hash rapide (FNV-1a) — pas cryptographique, juste pour unicité.
    const s = JSON.stringify(study);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    const short = (h >>> 0).toString(16).padStart(8, '0').slice(0, 4);
    return `${stamp}-${short}`;
}

/**
 * Persiste une étude sectorielle dans MCC. Idempotent : deux appels sur la même
 * étude à la même seconde produisent le même `versionId` (déterministe).
 */
export async function persistSectorStudy(
    study: SectorStudy,
    opts: { source?: 'baseline' | 'llm-enriched'; authorId?: string; at?: Date } = {},
): Promise<PersistedSectorStudy> {
    const at = opts.at ?? new Date();
    const versionId = computeVersionId(study, at);
    const payload: PersistedSectorStudy = {
        versionId,
        slug: study.vertical,
        subVariant: study.subVariant,
        createdAt: at.toISOString(),
        source: opts.source ?? (study.confidence && study.confidence > 0.6 ? 'llm-enriched' : 'baseline'),
        authorId: opts.authorId,
        study,
    };
    const path = `${BASE_PATH}/${study.vertical}/${versionId}`;
    try {
        await Nexus.adapter.set(path, payload);
        logger.info(`[SectorStudyStore] Persisté ${path} (source=${payload.source} conf=${study.confidence ?? '?'})`);
    } catch (err) {
        const msg = toError(err).message;
        logger.error(`[SectorStudyStore] Échec persistance ${path}: ${msg}`);
        throw err;
    }
    return payload;
}

/** Récupère une version précise d'une étude. Retourne null si absente. */
export async function getSectorStudyVersion(slug: string, versionId: string): Promise<PersistedSectorStudy | null> {
    const path = `${BASE_PATH}/${slug}/${versionId}`;
    return (await Nexus.adapter.get<PersistedSectorStudy>(path)) ?? null;
}

/**
 * Récupère la version la plus récente d'une étude pour un slug donné.
 * Utilise `query` puis tri lexicographique sur versionId (== tri chronologique).
 */
export async function getLatestSectorStudy(slug: string): Promise<PersistedSectorStudy | null> {
    const collectionPath = `${BASE_PATH}/${slug}`;
    let studies: PersistedSectorStudy[] = [];
    try {
        studies = await Nexus.adapter.query<PersistedSectorStudy>(collectionPath);
    } catch (err) {
        logger.warn(`[SectorStudyStore] Query ${collectionPath} échouée: ${toError(err).message}`);
        return null;
    }
    if (!studies.length) return null;
    // Tri desc par versionId (lexicographique = chronologique)
    return studies.slice().sort((a, b) => (b.versionId ?? '').localeCompare(a.versionId ?? ''))[0];
}

/** Liste TOUTES les études persistées d'un slug (ordre chronologique décroissant). */
export async function listSectorStudies(slug: string): Promise<PersistedSectorStudy[]> {
    const collectionPath = `${BASE_PATH}/${slug}`;
    try {
        const studies = await Nexus.adapter.query<PersistedSectorStudy>(collectionPath);
        return studies.slice().sort((a, b) => (b.versionId ?? '').localeCompare(a.versionId ?? ''));
    } catch (err) {
        logger.warn(`[SectorStudyStore] Query ${collectionPath} échouée: ${toError(err).message}`);
        return [];
    }
}

// ── Exports groupés (facultatif) ────────────────────────────────────────────────

export const SectorStudyStore = {
    persist: persistSectorStudy,
    get: getSectorStudyVersion,
    getLatest: getLatestSectorStudy,
    list: listSectorStudies,
    /** Exposé pour tests uniquement — pas de reason business à l'utiliser. */
    _computeVersionId: computeVersionId,
} as const;
