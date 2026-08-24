/**
 * 🏭 generateVertical — le GÉNÉRATEUR (fonction pure) du Vertical Forge
 *
 * Transforme un VerticalBlueprint en arborescence de fichiers + patchs de câblage.
 * PUR (aucune I/O) → testable et déterministe.
 */

import {
    requiredHardwareFor,
    type CapabilityKey,
} from '../catalog/CapabilityCatalog';
import {
    type VerticalBlueprint,
    precisionAtLeast,
    resolveBlueprintCapabilities,
} from '../blueprint/VerticalBlueprint';
import {
    renderKpiDashboard,
    renderWorkflowServices,
    renderRegulationGuards,
    renderHardwareProvisioning,
    renderVerticalTest,
} from './templates';
import type { GeneratedFile, WiringPatch, ForgeOutput } from './types';
import { renderWiring } from './wiringPatcher';
import {
    renderAdapters,
    renderPlugin,
    renderIndex,
    renderTokens,
    renderDna,
    renderStubs,
} from './stubRenderer';

export type { GeneratedFile, WiringPatch, ForgeOutput } from './types';

export interface ForgeOptions {
    /** Émettre des pages-stubs pour les routes (défaut true). */
    emitStubs?: boolean;
}

/**
 * Génère l'arborescence d'une verticale à partir de son Blueprint.
 * @returns fichiers à écrire + patchs de câblage + problèmes de validation.
 */
export function generateVertical(bp: VerticalBlueprint, opts: ForgeOptions = {}): ForgeOutput {
    const emitStubs = opts.emitStubs ?? true;
    const files: GeneratedFile[] = [];
    const issues: string[] = [];

    // Cohérence hardware : le blueprint déclare-t-il tout le matériel impliqué ?
    const active = (Object.keys(resolveBlueprintCapabilities(bp)) as CapabilityKey[])
        .filter(k => resolveBlueprintCapabilities(bp)[k]);
    const impliedHw = requiredHardwareFor(active);
    for (const hw of impliedHw) {
        if (!bp.hardware.includes(hw)) {
            issues.push(`hardware impliqué par les capabilities mais absent du blueprint : ${hw}`);
        }
    }

    const withAdapters = precisionAtLeast(bp.precision, 'L1');
    const withSubstance = precisionAtLeast(bp.precision, 'L2');
    const withHardwareAndTests = precisionAtLeast(bp.precision, 'L3');

    // Toujours : plugin + index (L0).
    if (withAdapters) files.push(...renderAdapters(bp));
    files.push(renderPlugin(bp));
    files.push(renderIndex(bp, withAdapters));

    // L1 : tokens + DNA + stubs de route.
    if (withAdapters) {
        files.push(renderTokens(bp));
        files.push({ ...renderDna(bp), skipIfExists: true });
        if (emitStubs) files.push(...renderStubs(bp));
    }

    // L2+ : émettre la richesse depuis SectorStudy.substance.
    if (withSubstance && bp.substance) {
        files.push(...renderKpiDashboard({ slug: bp.slug, className: bp.className, kpis: bp.substance.kpis, subVariant: bp.substance.subVariant }));
        files.push(...renderWorkflowServices({ slug: bp.slug, className: bp.className, workflows: bp.substance.workflows }));
        files.push(...renderRegulationGuards({ slug: bp.slug, className: bp.className, regulations: bp.substance.regulations }));
    }

    // L3 : hardware provisioning + tests smoke auto-générés.
    if (withHardwareAndTests && bp.substance) {
        files.push(...renderHardwareProvisioning({ slug: bp.slug, className: bp.className, hardware: bp.substance.hardware }));
        files.push(...renderVerticalTest({
            slug: bp.slug,
            className: bp.className,
            routes: bp.routes.map(r => ({ path: r.path, componentPath: r.componentPath, componentExport: r.componentExport })),
            capabilities: (Object.keys(resolveBlueprintCapabilities(bp)) as CapabilityKey[]).filter(k => resolveBlueprintCapabilities(bp)[k] === true),
        }));
    }

    return { slug: bp.slug, files, wiring: renderWiring(bp), issues };
}
