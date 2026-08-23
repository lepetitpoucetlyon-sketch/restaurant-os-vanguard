/**
 * 🧪 P3 — génération L2/L3 depuis SectorStudy substance + StudyToBlueprintCompiler.
 */

import { describe, it, expect } from 'vitest';

import {
    renderKpiDashboard,
    renderWorkflowServices,
    renderRegulationGuards,
    renderHardwareProvisioning,
    renderVerticalTest,
} from '@/verticals/_shared/forge/templates';
import { compileStudyToBlueprintProposal } from '@/verticals/_shared/forge/StudyToBlueprintCompiler';
import { generateVertical } from '@/verticals/_shared/forge/generateVertical';
import type { VerticalBlueprint } from '@/verticals/_shared/blueprint/VerticalBlueprint';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';

function mkStudy(overrides: Partial<SectorStudy> = {}): SectorStudy {
    return {
        vertical: 'sample', summary: 'x',
        workflows: [], regulations: [], hardware: [], kpis: [],
        businessRules: [], integrations: [], confidence: 0.5,
        ...overrides,
    };
}

function mkBlueprint(overrides: Partial<VerticalBlueprint> = {}): VerticalBlueprint {
    return {
        slug: 'sample',
        className: 'SampleVertical',
        profile: 'A',
        meta: { emoji: '🧪', label: 'Sample', name: 'Sample', description: 'test' },
        capabilities: { mod_pos: true },
        tokens: { defaultTokens: {}, verticalTokens: {}, appearance: 'light' },
        healthMetrics: {},
        routes: [],
        events: [],
        hardware: [],
        legalType: 'HOSPITALITY',
        precision: 'L1',
        ...overrides,
    };
}

// ── Templates ──────────────────────────────────────────────────────────────────

describe('Templates — kpiDashboard', () => {
    it('émet 2 fichiers (dashboard + service) si KPIs présents', () => {
        const files = renderKpiDashboard({
            slug: 'sample', className: 'SampleVertical',
            kpis: [{ id: 'revenue', label: 'CA', unit: '€', description: 'CA total' }],
        });
        expect(files).toHaveLength(2);
        expect(files[0].path).toMatch(/SampleKpiDashboard\.tsx$/);
        expect(files[1].path).toMatch(/SampleKpiService\.ts$/);
        expect(files.every(f => f.skipIfExists === true)).toBe(true);
        expect(files[0].content).toContain('title="CA"');
    });

    it('n\'émet rien si KPIs vides', () => {
        expect(renderKpiDashboard({ slug: 's', className: 'SVertical', kpis: [] })).toEqual([]);
    });
});

describe('Templates — workflowService', () => {
    it('émet 1 fichier par workflow avec events', () => {
        const files = renderWorkflowServices({
            slug: 'sample', className: 'SampleVertical',
            workflows: [
                { id: 'encaissement', label: 'Encaissement', description: 'vente + sceau', capabilities: ['mod_pos'], emits: ['finance.order_sealed'] },
                { id: 'reception', label: 'Réception BL', description: 'BL', capabilities: ['mod_inventory'] },
            ],
        });
        expect(files).toHaveLength(2);
        expect(files[0].path).toMatch(/SampleEncaissementService\.ts$/);
        expect(files[0].content).toContain("NexusEventBus.emit('finance.order_sealed'");
        expect(files[1].content).toContain("workflowId: 'reception'");
    });
});

describe('Templates — regulationGuard', () => {
    it('émet 1 guard par régulation avec class Violation', () => {
        const files = renderRegulationGuards({
            slug: 'sample', className: 'SampleVertical',
            regulations: [{ id: 'haccp', label: 'HACCP', description: 'PMS', reference: 'CE 852/2004' }],
        });
        expect(files).toHaveLength(1);
        expect(files[0].content).toContain('class SampleHaccpViolation extends Error');
        expect(files[0].content).toContain("regulationId = 'haccp'");
        expect(files[0].content).toContain('CE 852/2004');
    });
});

describe('Templates — hardwareProvisioning', () => {
    it('émet 1 seul fichier avec tous les kits', () => {
        const files = renderHardwareProvisioning({
            slug: 'sample', className: 'SampleVertical',
            hardware: [
                { kind: 'receipt_printer', label: 'Imprimante ticket', rationale: 'POS' },
                { kind: 'temperature_probe', label: 'Sonde', rationale: 'HACCP', optional: true },
            ],
        });
        expect(files).toHaveLength(1);
        expect(files[0].path).toMatch(/SampleHardwareProvisioning\.ts$/);
        expect(files[0].content).toContain("kind: 'receipt_printer'");
        expect(files[0].content).toContain('optional: true');
    });
});

describe('Templates — verticalTest', () => {
    it('émet un fichier smoke-test qui vérifie blueprint + routes + caps', () => {
        const files = renderVerticalTest({
            slug: 'sample', className: 'SampleVertical',
            routes: [{ path: '/sample', componentPath: './x', componentExport: 'X' }],
            capabilities: ['mod_pos', 'mod_kds'],
        });
        expect(files).toHaveLength(1);
        expect(files[0].path).toMatch(/generated\/sample-smoke\.test\.ts$/);
        expect(files[0].content).toContain("expect(routePaths).toContain('/sample')");
        expect(files[0].content).toContain("expect(caps).toContain('mod_pos')");
    });
});

// ── StudyToBlueprintCompiler ───────────────────────────────────────────────────

describe('StudyToBlueprintCompiler', () => {
    it('active les capabilities depuis workflows[].capabilities', () => {
        const proposal = compileStudyToBlueprintProposal({
            slug: 'sample', className: 'SampleVertical',
            study: mkStudy({
                workflows: [{ id: 'x', label: 'X', description: '', capabilities: ['mod_pos', 'mod_kds'], emits: ['ops.done'] }],
            }),
        });
        expect(proposal.capabilities['mod_pos']).toBe(true);
        expect(proposal.capabilities['mod_kds']).toBe(true);
    });

    it('active mod_haccp si régulation mentionne HACCP', () => {
        const proposal = compileStudyToBlueprintProposal({
            slug: 'sample', className: 'SampleVertical',
            study: mkStudy({ regulations: [{ id: 'r1', label: 'PMS HACCP', description: '' }] }),
        });
        expect(proposal.capabilities['mod_haccp']).toBe(true);
    });

    it('propose une route KPI dashboard si kpis[] non vide', () => {
        const proposal = compileStudyToBlueprintProposal({
            slug: 'sample', className: 'SampleVertical',
            study: mkStudy({ kpis: [{ id: 'x', label: 'X', unit: '€', description: '' }] }),
        });
        expect(proposal.routes).toHaveLength(1);
        expect(proposal.routes[0].path).toBe('/sample/kpis');
    });

    it('ajoute hardware non-optionnel + rationale', () => {
        const proposal = compileStudyToBlueprintProposal({
            slug: 'sample', className: 'SampleVertical',
            study: mkStudy({
                hardware: [
                    { kind: 'receipt_printer', label: 'Ticket', rationale: 'POS' },
                    { kind: 'scale', label: 'Balance', rationale: 'pesée', optional: true },
                ],
            }),
        });
        expect(proposal.hardware).toContain('receipt_printer');
        expect(proposal.hardware).not.toContain('scale');
    });

    it('devine le pilier depuis le namespace de l\'event', () => {
        const proposal = compileStudyToBlueprintProposal({
            slug: 'sample', className: 'SampleVertical',
            study: mkStudy({
                workflows: [{ id: 'x', label: 'X', description: '', capabilities: [], emits: ['commerce.reserved', 'finance.sealed'] }],
            }),
        });
        expect(proposal.events.find(e => e.name === 'commerce.reserved')?.pillar).toBe('commerce');
        expect(proposal.events.find(e => e.name === 'finance.sealed')?.pillar).toBe('finance');
    });
});

// ── generateVertical extension L2/L3 ───────────────────────────────────────────

describe('generateVertical — L2/L3 émission depuis substance', () => {
    it('L2 avec substance → émet KPI dashboard + workflow services + regulation guards', () => {
        const bp = mkBlueprint({
            precision: 'L2',
            substance: mkStudy({
                kpis: [{ id: 'k', label: 'K', unit: '€', description: '' }],
                workflows: [{ id: 'w', label: 'W', description: '', capabilities: [], emits: [] }],
                regulations: [{ id: 'r', label: 'R', description: '' }],
            }),
        });
        const out = generateVertical(bp);
        expect(out.files.some(f => /KpiDashboard\.tsx$/.test(f.path))).toBe(true);
        expect(out.files.some(f => /WService\.ts$/.test(f.path))).toBe(true);
        expect(out.files.some(f => /RGuard\.ts$/.test(f.path))).toBe(true);
    });

    it('L3 avec substance → ajoute HardwareProvisioning + smoke test', () => {
        const bp = mkBlueprint({
            precision: 'L3',
            substance: mkStudy({
                hardware: [{ kind: 'receipt_printer', label: 'x', rationale: 'x' }],
            }),
        });
        const out = generateVertical(bp);
        expect(out.files.some(f => /HardwareProvisioning\.ts$/.test(f.path))).toBe(true);
        expect(out.files.some(f => /sample-smoke\.test\.ts$/.test(f.path))).toBe(true);
    });

    it('L1 n\'émet PAS les templates L2 (rétro-compatible)', () => {
        const bp = mkBlueprint({ precision: 'L1', substance: mkStudy({ kpis: [{ id: 'x', label: 'x', unit: '€', description: '' }] }) });
        const out = generateVertical(bp);
        expect(out.files.some(f => /KpiDashboard/.test(f.path))).toBe(false);
    });

    it('L2 SANS substance → n\'émet pas les templates (validateBlueprint sépare)', () => {
        const bp = mkBlueprint({ precision: 'L2' });  // pas de substance !
        const out = generateVertical(bp);
        expect(out.files.some(f => /KpiDashboard/.test(f.path))).toBe(false);
    });

    it('templates générés portent skipIfExists=true (jamais d\'écrasement)', () => {
        const bp = mkBlueprint({
            precision: 'L2',
            substance: mkStudy({
                kpis: [{ id: 'k', label: 'K', unit: '€', description: '' }],
            }),
        });
        const out = generateVertical(bp);
        const genFiles = out.files.filter(f => /KpiDashboard|KpiService/.test(f.path));
        expect(genFiles.every(f => f.skipIfExists === true)).toBe(true);
    });
});
