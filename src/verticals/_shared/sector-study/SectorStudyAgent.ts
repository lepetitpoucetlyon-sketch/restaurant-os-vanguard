/**
 * 🔬 SectorStudyAgent — l'agent qui donne de la SUBSTANCE à une verticale (Pilier 5)
 *
 * Vision : « lancer en automatique un agent qui fasse une étude de secteur pour
 * développer et rendre complète la verticale ». Cet agent produit un SectorStudy
 * (processus, réglementations, matériel, KPIs, subtilités) qui nourrit le Blueprint
 * et fait monter le générateur en précision (L2/L3).
 *
 * Deux niveaux, toujours du résultat :
 *   1. `deriveBaselineStudy` — DÉTERMINISTE, dérivé de la taxonomie ProfileArchetype
 *      (marche hors-ligne, testable, jamais vide).
 *   2. `runSectorStudy(input, llm)` — enrichit la baseline via un LLM INJECTÉ
 *      (agnostique : n'importe quel provider). En cas d'échec/absence → baseline.
 *
 * Gère aussi les SOUS-VARIANTES (ex. restaurant gastronomique vs brunch) : l'input
 * porte la sous-variante et le prompt demande explicitement les différenciateurs.
 */

import type {
    SectorStudy,
    WorkflowSpec,
    RegulationSpec,
    HardwareSpec,
    KpiSpec,
} from '../blueprint/SectorStudy';
import {
    type HardwareKind,
    requiredHardwareFor,
} from '../catalog/CapabilityCatalog';
import {
    type ProfileId,
    getProfile,
    profileCapabilities,
} from '../catalog/ProfileArchetype';

/** LLM injecté (agnostique) : reçoit un prompt système+user, renvoie du texte brut. */
export type StudyLLM = (input: { system: string; user: string }) => Promise<string>;

export interface SectorStudyInput {
    slug: string;
    profileId: ProfileId;
    /** Sous-variante ciblée (ex. { slug: 'gastronomique', label: 'Gastronomique' }). */
    subVariant?: { slug: string; label: string; description?: string };
    /** Contexte libre supplémentaire fourni par l'opérateur (facultatif). */
    extraContext?: string;
}

const HARDWARE_LABELS: Record<HardwareKind, string> = {
    receipt_printer: 'Imprimante ticket',
    cash_drawer: 'Tiroir-caisse',
    card_terminal: 'TPE (terminal carte)',
    kds_screen: 'Écran cuisine (KDS)',
    kitchen_printer: 'Imprimante cuisine',
    label_printer: 'Imprimante étiquettes',
    barcode_scanner: 'Douchette code-barres',
    scale: 'Balance connectée',
    temperature_probe: 'Sonde de température',
    kiosk_terminal: 'Borne kiosque',
    rfid_reader: 'Lecteur RFID',
    turnstile: 'Tourniquet d\'accès',
    badge_encoder: 'Encodeur de badge',
};

// ── Baseline déterministe (aucune I/O, aucun LLM) ───────────────────────────────

/**
 * Dérive une étude sectorielle de base à partir de la taxonomie du profil.
 * Toujours non vide : garantit un minimum de substance même sans LLM.
 */
export function deriveBaselineStudy(input: SectorStudyInput): SectorStudy {
    const profile = getProfile(input.profileId);
    const caps = profileCapabilities(input.profileId);

    const hardware: HardwareSpec[] = requiredHardwareFor(caps).map(kind => ({
        kind,
        label: HARDWARE_LABELS[kind],
        rationale: `Impliqué par les capabilities du profil ${profile.label}.`,
    }));

    const regulations: RegulationSpec[] = (profile.legalAddenda ?? []).map(addendum => ({
        id: addendum.toLowerCase(),
        label: `Conformité ${addendum}`,
        description: `Obligations réglementaires du secteur (addendum ${addendum}).`,
        legalAddendum: addendum,
    }));

    // Workflows de base : un par capability structurante majeure du profil.
    const workflows: WorkflowSpec[] = [
        {
            id: 'encaissement',
            label: 'Encaissement NF525',
            description: 'Vente → sceau fiscal chaîné → journal immuable.',
            capabilities: ['mod_pos'],
            emits: ['finance.order_sealed'],
        },
    ];

    const kpis: KpiSpec[] = [
        { id: 'revenue', label: 'Chiffre d\'affaires', unit: '€', description: 'CA encaissé sur la période.' },
        { id: 'avg_ticket', label: 'Ticket moyen', unit: '€', description: 'Panier moyen par transaction.' },
    ];

    const target = input.subVariant ? `${profile.label} — ${input.subVariant.label}` : profile.label;
    return {
        vertical: input.slug,
        subVariant: input.subVariant?.slug,
        summary: `Secteur « ${target} » (profil ${profile.id} — ${profile.label}). Exemples : ${profile.examples.join(', ')}.`,
        workflows,
        regulations,
        hardware,
        kpis,
        businessRules: [...profile.specifics],
        integrations: [],
        variantDifferentiators: input.subVariant ? [input.subVariant.description ?? ''].filter(Boolean) : undefined,
        confidence: 0.5,
    };
}

// ── Prompt de recherche ─────────────────────────────────────────────────────────

export function buildStudyPrompt(input: SectorStudyInput): { system: string; user: string } {
    const profile = getProfile(input.profileId);
    const system = [
        'Tu es un analyste sectoriel expert en logiciels de gestion B2B (POS, ERP verticaux).',
        'Produis une étude de secteur ACTIONNABLE pour paramétrer une verticale SaaS.',
        'Réponds UNIQUEMENT par un objet JSON valide respectant ce schéma :',
        '{ "summary": string, "workflows": [{"id","label","description","capabilities":[],"emits":[]}],',
        '  "regulations": [{"id","label","reference","description","legalAddendum"}],',
        '  "hardware": [{"kind","label","rationale","optional"}],',
        '  "kpis": [{"id","label","unit","description"}],',
        '  "businessRules": string[], "integrations": string[], "variantDifferentiators": string[], "confidence": number }',
        'Pas de texte hors JSON, pas de bloc de code markdown.',
    ].join('\n');

    const user = [
        `Verticale : ${input.slug} (profil ${profile.id} — ${profile.label}).`,
        `Métiers représentatifs : ${profile.examples.join(', ')}.`,
        `Gating culinaire : ${profile.usesCulinaryStock ? 'oui' : 'non'}.`,
        `Spécificités connues : ${profile.specifics.join(' ; ')}.`,
        input.subVariant
            ? `SOUS-VARIANTE ciblée : ${input.subVariant.label} (${input.subVariant.slug}). ${input.subVariant.description ?? ''} Détaille ce qui la DIFFÉRENCIE des autres sous-variantes (variantDifferentiators).`
            : 'Liste les sous-variantes pertinentes et leurs différences dans variantDifferentiators.',
        input.extraContext ? `Contexte supplémentaire : ${input.extraContext}` : '',
        'Sois concret : processus métier réels, obligations légales françaises/UE, matériel terrain, KPIs pilotables.',
    ].filter(Boolean).join('\n');

    return { system, user };
}

// ── Parsing robuste ─────────────────────────────────────────────────────────────

/** Extrait un objet JSON d'une réponse LLM (tolère fences ```json et texte parasite). */
export function extractJson(raw: string): unknown {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) throw new Error('Aucun JSON détecté dans la réponse LLM.');
    return JSON.parse(candidate.slice(start, end + 1));
}

/** Fusionne une étude LLM (partielle/bruitée) sur la baseline (source de complétude). */
export function mergeOntoBaseline(baseline: SectorStudy, parsed: Record<string, unknown>): SectorStudy {
    const arr = <T>(v: unknown, fallback: readonly T[]): readonly T[] =>
        Array.isArray(v) && v.length ? (v as T[]) : fallback;
    return {
        ...baseline,
        summary: typeof parsed.summary === 'string' && parsed.summary ? parsed.summary : baseline.summary,
        workflows: arr<WorkflowSpec>(parsed.workflows, baseline.workflows),
        regulations: arr<RegulationSpec>(parsed.regulations, baseline.regulations),
        hardware: arr<HardwareSpec>(parsed.hardware, baseline.hardware),
        kpis: arr<KpiSpec>(parsed.kpis, baseline.kpis),
        businessRules: arr<string>(parsed.businessRules, baseline.businessRules),
        integrations: arr<string>(parsed.integrations, baseline.integrations),
        variantDifferentiators: arr<string>(parsed.variantDifferentiators, baseline.variantDifferentiators ?? []),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };
}

// ── Point d'entrée ───────────────────────────────────────────────────────────────

/**
 * Produit une étude de secteur. Sans LLM → baseline déterministe. Avec LLM →
 * baseline enrichie ; toute erreur (réseau, JSON invalide) retombe sur la baseline.
 */
export async function runSectorStudy(input: SectorStudyInput, llm?: StudyLLM): Promise<SectorStudy> {
    const baseline = deriveBaselineStudy(input);
    if (!llm) return baseline;
    try {
        const raw = await llm(buildStudyPrompt(input));
        const parsed = extractJson(raw) as Record<string, unknown>;
        return mergeOntoBaseline(baseline, parsed);
    } catch {
        return { ...baseline, confidence: Math.min(baseline.confidence ?? 0.5, 0.5) };
    }
}
