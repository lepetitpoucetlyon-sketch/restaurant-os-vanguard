/**
 * 🧱 StudyToBlueprintCompiler — compile SectorStudy → propositions Blueprint (§C.5 P3).
 *
 * Pendant symétrique de `generateVertical` (Blueprint → fichiers) : ce compilateur
 * transforme une étude sectorielle en PROPOSITIONS d'enrichissement de Blueprint
 * (capabilities, hardware, routes, events). Résultat = suggestions présentées à
 * l'opérateur pour validation (human-in-the-loop) — jamais appliqué en silence.
 *
 * Utilisé pour Axe A (création d'une nouvelle verticale) : l'opérateur lance
 * l'étude sectorielle, le compilateur propose des deltas au blueprint de base.
 */

import type { CapabilitySet, HardwareKind } from '../catalog/CapabilityCatalog';
import { isKnownCapability } from '../catalog/CapabilityCatalog';
import type { BlueprintEvent, BlueprintRoute } from '../blueprint/VerticalBlueprint';
import type { SectorStudy } from '../blueprint/SectorStudy';

// ── Sortie ──────────────────────────────────────────────────────────────────────

export interface BlueprintProposal {
    /** Deltas capabilities suggérés (true = activer, false = désactiver). */
    readonly capabilities: CapabilitySet;
    readonly hardware: readonly HardwareKind[];
    /** Routes suggérées basées sur les KPIs (un dashboard par groupe). */
    readonly routes: readonly BlueprintRoute[];
    readonly events: readonly BlueprintEvent[];
    /** Notes explicatives par proposition (audit trail). */
    readonly rationale: readonly string[];
}

// ── Compilation ─────────────────────────────────────────────────────────────────

export function compileStudyToBlueprintProposal(input: {
    study: SectorStudy;
    slug: string;
    className: string;
}): BlueprintProposal {
    const { study, slug, className } = input;
    const capabilities: CapabilitySet = {};
    const hardware = new Set<HardwareKind>();
    const routes: BlueprintRoute[] = [];
    const events: BlueprintEvent[] = [];
    const rationale: string[] = [];

    // ── Capabilities depuis workflows (chaque workflow.capabilities[]) ──────
    for (const wf of study.workflows) {
        for (const cap of wf.capabilities) {
            if (isKnownCapability(cap)) {
                capabilities[cap] = true;
                rationale.push(`Capability "${cap}" activée par workflow "${wf.id}"`);
            }
        }
        // Events déclarés par les workflows → suggestions BlueprintEvent
        for (const ev of wf.emits ?? []) {
            events.push({
                name: ev,
                pillar: guessPillarFromEventName(ev),
                description: `Émis par le workflow "${wf.label}"`,
            });
        }
    }

    // ── Hardware ──────────────────────────────────────────────────────────
    for (const hw of study.hardware) {
        if (!hw.optional) {
            hardware.add(hw.kind);
            rationale.push(`Hardware "${hw.kind}" ajouté (${hw.rationale})`);
        }
    }

    // ── Routes proposées : une route de dashboard si KPIs existent ─────────
    if (study.kpis.length > 0) {
        const prefix = className.replace(/Vertical$/, '');
        routes.push({
            path: `/${slug}/kpis`,
            label: `KPIs ${prefix}`,
            componentPath: `./presentation/${prefix}KpiDashboard`,
            componentExport: `${prefix}KpiDashboard`,
        });
        rationale.push(`Route KPI dashboard proposée (${study.kpis.length} KPIs identifiés)`);
    }

    // ── Regulations → capabilities de conformité si connues ────────────────
    for (const reg of study.regulations) {
        const label = (reg.label + ' ' + reg.description).toLowerCase();
        if (/haccp|hygiène|allergène/i.test(label)) {
            capabilities['mod_haccp'] = true;
            rationale.push(`mod_haccp activé par regulation "${reg.id}"`);
        }
        if (/rgpd|données personnelles/i.test(label)) {
            capabilities['mod_rgpd'] = true;
            rationale.push(`mod_rgpd activé par regulation "${reg.id}"`);
        }
        if (/erp|jauge|incendie/i.test(label)) {
            capabilities['mod_registre'] = true;
            rationale.push(`mod_registre activé par regulation "${reg.id}"`);
        }
    }

    return {
        capabilities,
        hardware: [...hardware],
        routes,
        events,
        rationale,
    };
}

/** Devine le pilier propriétaire depuis le namespace de l'event. */
function guessPillarFromEventName(ev: string): string {
    const first = ev.split('.')[0]?.toLowerCase();
    const known = ['ops', 'commerce', 'finance', 'compliance', 'human', 'logistics', 'intelligence', 'facility', 'mcc'];
    return known.includes(first ?? '') ? first! : 'ops';
}
