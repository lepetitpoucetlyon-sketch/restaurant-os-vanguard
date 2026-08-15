/**
 * 📚 SectorStudy — la SUBSTANCE d'une verticale (sortie de l'Agent d'Étude de Secteur)
 *
 * Un scaffold vide ne suffit pas : pour que le client final ait « absolument tout »
 * pour son domaine, il faut de la MATIÈRE métier réelle — processus, réglementations,
 * matériel, KPIs, subtilités. Le SectorStudyAgent (Pilier 5) produit ce document
 * structuré ; il enrichit ensuite le VerticalBlueprint et guide le générateur pour
 * atteindre les tiers de précision L2/L3.
 *
 * C'est un CONTRAT DE DONNÉES (types purs) — module feuille, aucune dépendance.
 * Les sous-variantes (ex. restaurant brunch vs gastronomique) portent des deltas
 * de substance via `SectorStudyDelta`.
 */

import type { CapabilityKey, HardwareKind } from '../catalog/CapabilityCatalog';

/** Un processus métier clé de la verticale (ex. « Ordre de Réparation » pour un garage). */
export interface WorkflowSpec {
    /** Identifiant court en kebab-case (ex. 'repair-order'). */
    id: string;
    label: string;
    /** Description du flux de bout en bout. */
    description: string;
    /** Capabilities du catalogue impliquées par ce workflow. */
    capabilities: readonly CapabilityKey[];
    /** Events métier déclenchés (namespace <slug>.<action> ou universel). */
    emits?: readonly string[];
}

/** Une obligation réglementaire / légale propre au secteur. */
export interface RegulationSpec {
    id: string;
    label: string;
    /** Référence légale (article, norme). */
    reference?: string;
    description: string;
    /** Indice d'addendum légal (aligné LegalContractGenerator.VerticalType). */
    legalAddendum?: string;
}

/** Un périphérique matériel du secteur et sa raison d'être. */
export interface HardwareSpec {
    kind: HardwareKind;
    label: string;
    /** Pourquoi ce matériel est nécessaire dans ce métier. */
    rationale: string;
    /** Optionnel plutôt qu'indispensable. */
    optional?: boolean;
}

/** Un indicateur de pilotage significatif pour le secteur. */
export interface KpiSpec {
    id: string;
    label: string;
    /** Unité / format (%, €, minutes, taux d'occupation…). */
    unit: string;
    description: string;
}

/**
 * Étude sectorielle complète d'une verticale. Alimentée par recherche
 * (LLM + sources) puis relue/validée avant d'être figée dans un Blueprint.
 */
export interface SectorStudy {
    /** Slug de la verticale étudiée. */
    vertical: string;
    /** Sous-variante ciblée le cas échéant (ex. 'gastronomique'). */
    subVariant?: string;
    /** Synthèse exécutive du secteur en quelques lignes. */
    summary: string;
    /** Processus métier structurants. */
    workflows: readonly WorkflowSpec[];
    /** Cadre réglementaire. */
    regulations: readonly RegulationSpec[];
    /** Parc matériel typique. */
    hardware: readonly HardwareSpec[];
    /** Indicateurs de performance clés. */
    kpis: readonly KpiSpec[];
    /** Subtilités & règles métier non triviales (texte libre, actionnable). */
    businessRules: readonly string[];
    /** Systèmes externes à intégrer (SEPA, channel managers, TecDoc…). */
    integrations: readonly string[];
    /** Ce qui différencie les sous-variantes entre elles. */
    variantDifferentiators?: readonly string[];
    /** Provenance de l'étude (URLs, docs) — traçabilité. */
    sources?: readonly string[];
    /** Métadonnées de génération (horodatage injecté hors script déterministe). */
    generatedAt?: string;
    /** Fiabilité auto-évaluée de l'étude (0-1) — sous 0.6 = relecture humaine requise. */
    confidence?: number;
}

/** Deltas de substance appliqués par une sous-variante sur l'étude de base. */
export type SectorStudyDelta = Partial<
    Pick<SectorStudy, 'summary' | 'workflows' | 'regulations' | 'hardware' | 'kpis' | 'businessRules' | 'integrations'>
>;

/** Fusionne une étude de base avec les deltas d'une sous-variante (concat des listes). */
export function mergeSectorStudy(base: SectorStudy, delta: SectorStudyDelta, subVariant: string): SectorStudy {
    return {
        ...base,
        subVariant,
        summary: delta.summary ?? base.summary,
        workflows: [...base.workflows, ...(delta.workflows ?? [])],
        regulations: [...base.regulations, ...(delta.regulations ?? [])],
        hardware: [...base.hardware, ...(delta.hardware ?? [])],
        kpis: [...base.kpis, ...(delta.kpis ?? [])],
        businessRules: [...base.businessRules, ...(delta.businessRules ?? [])],
        integrations: [...base.integrations, ...(delta.integrations ?? [])],
    };
}
