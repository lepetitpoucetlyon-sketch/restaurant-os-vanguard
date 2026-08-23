/**
 * 🧪 BlindSpotDetector — tests unitaires + audit intégration blueprints réels.
 *
 * Couvre :
 *  1. Runner : agrégation, tri par severity, robustesse aux règles qui jettent.
 *  2. Chaque famille de règles (regulatory/scale/catalog/cascade) — cas trigger vs no-trigger.
 *  3. Audit d'intégration : le détecteur trouve des gaps sur les 12 blueprints existants
 *     (prouve qu'il est utile immédiatement, pas juste sur les futurs blueprints).
 */

import { describe, it, expect } from 'vitest';

import {
    runBlindSpotRules,
    detectVerticalBlindSpots,
    detectTenantBlindSpots,
    type BlindSpotRule,
    type VerticalContext,
    type TenantContext,
} from '@/verticals/_shared/blind-spot';
import { DEFAULT_RULES } from '@/verticals/_shared/blind-spot/rules';
import {
    HACCP_REQUIRED_BUT_OFF,
    DLC_TRACEABILITY_MISSING,
} from '@/verticals/_shared/blind-spot/rules/regulatory';
import {
    FRANCHISE_WITHOUT_L3,
    L3_WITHOUT_FLEET,
} from '@/verticals/_shared/blind-spot/rules/scale-tier';
import {
    ALCOHOL_WITHOUT_BAR,
    APPOINTMENTS_WITHOUT_RESERVATIONS,
} from '@/verticals/_shared/blind-spot/rules/catalog-capability';
import {
    KDS_WITHOUT_POS,
    PLANNING_WITHOUT_HR,
} from '@/verticals/_shared/blind-spot/rules/cascade';
import { VERTICAL_BLUEPRINTS } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import { deriveBaselineStudy } from '@/verticals/_shared/sector-study/SectorStudyAgent';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';
import { emptyCompanyProfile, type CompanyProfile } from '@/modules/commerce/acquisition/onboarding/schemas/companyProfile';

// ── Fixtures ────────────────────────────────────────────────────────────────────

function baseStudy(overrides: Partial<SectorStudy> = {}): SectorStudy {
    return {
        vertical: 'restaurant',
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

function baseVerticalCtx(overrides: Partial<VerticalContext> = {}): VerticalContext {
    const bp = VERTICAL_BLUEPRINTS['restaurant'];
    return {
        blueprint: bp,
        study: baseStudy(),
        effectiveCapabilities: { mod_pos: true, mod_haccp: false, mod_kds: false },
        ...overrides,
    };
}

function baseTenantCtx(overrides: Partial<TenantContext> = {}): TenantContext {
    const profile: CompanyProfile = emptyCompanyProfile('Test');
    return {
        companyProfile: profile,
        qualification: { recommendedTier: 'L1', capabilities: {}, hardware: [] },
        study: baseStudy(),
        ...overrides,
    };
}

// ── 1. Runner ──────────────────────────────────────────────────────────────────

describe('BlindSpotDetector — runner', () => {
    it('agrège les BlindSpot déclenchés + calcule le summary par severity', () => {
        const rules: BlindSpotRule[] = [
            {
                id: 'test.a', family: 'regulatory', scope: 'vertical', defaultTitle: 'A',
                detectVertical: () => ({ severity: 'critical', evidence: ['e1'], suggestedFix: { kind: 'enable_capability', target: 'mod_x', rationale: 'r' } }),
            },
            {
                id: 'test.b', family: 'hardware', scope: 'vertical', defaultTitle: 'B',
                detectVertical: () => ({ severity: 'medium', evidence: ['e2'], suggestedFix: { kind: 'add_hardware', target: 'kds_screen', rationale: 'r' } }),
            },
            {
                id: 'test.c', family: 'guards', scope: 'vertical', defaultTitle: 'C',
                detectVertical: () => null, // ne trigger pas
            },
        ];
        const report = runBlindSpotRules(rules, 'vertical', baseVerticalCtx(), new Date('2026-08-23T10:00:00Z'));
        expect(report.triggered).toHaveLength(2);
        expect(report.summary.critical).toBe(1);
        expect(report.summary.medium).toBe(1);
        expect(report.totalRulesRun).toBe(3);
        // Tri : critical avant medium
        expect(report.triggered[0].id).toBe('test.a');
        expect(report.triggered[1].id).toBe('test.b');
    });

    it('une règle qui jette n\'interrompt pas les autres', () => {
        const rules: BlindSpotRule[] = [
            { id: 'test.crash', family: 'regulatory', scope: 'vertical', defaultTitle: '', detectVertical: () => { throw new Error('boom'); } },
            { id: 'test.ok', family: 'regulatory', scope: 'vertical', defaultTitle: '',
              detectVertical: () => ({ severity: 'low', evidence: [], suggestedFix: { kind: 'manual', rationale: '' } }) },
        ];
        const report = runBlindSpotRules(rules, 'vertical', baseVerticalCtx());
        expect(report.triggered).toHaveLength(1);
        expect(report.triggered[0].id).toBe('test.ok');
    });

    it('ne fait tourner que les règles applicables au scope', () => {
        const rules: BlindSpotRule[] = [
            { id: 'v', family: 'guards', scope: 'vertical', defaultTitle: '',
              detectVertical: () => ({ severity: 'low', evidence: [], suggestedFix: { kind: 'manual', rationale: '' } }) },
            { id: 't', family: 'guards', scope: 'tenant', defaultTitle: '',
              detectTenant: () => ({ severity: 'low', evidence: [], suggestedFix: { kind: 'manual', rationale: '' } }) },
            { id: 'b', family: 'guards', scope: 'both', defaultTitle: '',
              detectVertical: () => ({ severity: 'low', evidence: [], suggestedFix: { kind: 'manual', rationale: '' } }),
              detectTenant: () => ({ severity: 'low', evidence: [], suggestedFix: { kind: 'manual', rationale: '' } }) },
        ];
        expect(runBlindSpotRules(rules, 'vertical', baseVerticalCtx()).totalRulesRun).toBe(2);   // v + b
        expect(runBlindSpotRules(rules, 'tenant', baseTenantCtx()).totalRulesRun).toBe(2);       // t + b
    });
});

// ── 2. Règles individuelles ─────────────────────────────────────────────────────

describe('Règles regulatory', () => {
    it('HACCP_REQUIRED_BUT_OFF déclenche si étude mentionne HACCP + capability off', () => {
        const ctx = baseVerticalCtx({
            study: baseStudy({ regulations: [{ id: 'haccp', label: 'Conformité HACCP', description: 'PMS' }] }),
            effectiveCapabilities: { mod_haccp: false },
        });
        const out = HACCP_REQUIRED_BUT_OFF.detectVertical!(ctx);
        expect(out).not.toBeNull();
        expect(out!.severity).toBe('critical');
        expect(out!.suggestedFix.target).toBe('mod_haccp');
    });

    it('HACCP_REQUIRED_BUT_OFF ne trigger pas si mod_haccp est true', () => {
        const ctx = baseVerticalCtx({
            study: baseStudy({ regulations: [{ id: 'haccp', label: 'HACCP', description: '' }] }),
            effectiveCapabilities: { mod_haccp: true },
        });
        expect(HACCP_REQUIRED_BUT_OFF.detectVertical!(ctx)).toBeNull();
    });

    it('DLC_TRACEABILITY_MISSING trigger sur variant tenant avec catalogue périssable', () => {
        const profile = emptyCompanyProfile('Frais&Co');
        profile.catalog.push({
            id: 'p1', name: 'Saumon frais', description: 'Norvège', priceInMicrounits: 25_000_000 as never,
            taxRate: 0.055, category: 'Poisson', isAvailable: true,
        });
        const ctx = baseTenantCtx({
            companyProfile: profile,
            qualification: { recommendedTier: 'L1', capabilities: { mod_haccp: false, mod_inventory: false }, hardware: [] },
        });
        const out = DLC_TRACEABILITY_MISSING.detectTenant!(ctx);
        expect(out).not.toBeNull();
        expect(out!.severity).toBe('high');
    });
});

describe('Règles scale/tier', () => {
    it('FRANCHISE_WITHOUT_L3 escalade en critical si siteCount ≥ 10 et tier < L3', () => {
        const profile = emptyCompanyProfile('Franchise ABC');
        profile.scale = { multiSite: true, siteCount: 15, evidence: ['15 établissements en France'] };
        const ctx = baseTenantCtx({
            companyProfile: profile,
            qualification: { recommendedTier: 'L2', capabilities: {}, hardware: [] },
        });
        const out = FRANCHISE_WITHOUT_L3.detectTenant!(ctx);
        expect(out).not.toBeNull();
        expect(out!.severity).toBe('critical');
        expect(out!.suggestedFix.target).toBe('L3');
    });

    it('L3_WITHOUT_FLEET trigger si tier L3 mais fleet_management off', () => {
        const ctx = baseTenantCtx({
            qualification: { recommendedTier: 'L3', capabilities: { mod_fleet_management: false }, hardware: [] },
        });
        const out = L3_WITHOUT_FLEET.detectTenant!(ctx);
        expect(out).not.toBeNull();
        expect(out!.severity).toBe('high');
    });
});

describe('Règles catalog/capability', () => {
    it('ALCOHOL_WITHOUT_BAR trigger si vin détecté sans mod_bar', () => {
        const profile = emptyCompanyProfile('Bistro');
        profile.catalog.push({
            id: 'v1', name: 'Vin rouge Côtes du Rhône', description: '', priceInMicrounits: 8_000_000 as never,
            taxRate: 0.20, category: 'Boissons', isAvailable: true,
        });
        const ctx = baseTenantCtx({ companyProfile: profile });
        const out = ALCOHOL_WITHOUT_BAR.detectTenant!(ctx);
        expect(out).not.toBeNull();
        expect(out!.suggestedFix.target).toBe('mod_bar');
    });

    it('APPOINTMENTS_WITHOUT_RESERVATIONS trigger sur "consultation"', () => {
        const profile = emptyCompanyProfile('Clinique');
        profile.catalog.push({
            id: 'c1', name: 'Consultation générale', description: '', priceInMicrounits: 45_000_000 as never,
            taxRate: 0.20, category: 'Soins', isAvailable: true,
        });
        const ctx = baseTenantCtx({ companyProfile: profile });
        const out = APPOINTMENTS_WITHOUT_RESERVATIONS.detectTenant!(ctx);
        expect(out).not.toBeNull();
        expect(out!.suggestedFix.target).toBe('mod_reservations');
    });
});

describe('Règles cascade', () => {
    it('KDS_WITHOUT_POS détecte mod_kds sans mod_pos (dependsOn violé)', () => {
        const ctx = baseVerticalCtx({
            effectiveCapabilities: { mod_kds: true, mod_pos: false },
        });
        const out = KDS_WITHOUT_POS.detectVertical!(ctx);
        expect(out).not.toBeNull();
        expect(out!.severity).toBe('critical');
    });

    it('PLANNING_WITHOUT_HR détecte mod_planning sans mod_hr', () => {
        const ctx = baseTenantCtx({
            qualification: { recommendedTier: 'L1', capabilities: { mod_planning: true, mod_hr: false }, hardware: [] },
        });
        const out = PLANNING_WITHOUT_HR.detectTenant!(ctx);
        expect(out).not.toBeNull();
    });
});

// ── 3. Audit d'intégration : les 12 blueprints réels ────────────────────────────

describe('Audit intégration — 12 blueprints existants', () => {
    it('DEFAULT_RULES contient exactement 20 règles (4 familles × 5)', () => {
        expect(DEFAULT_RULES).toHaveLength(20);
    });

    it('détecte sans crash tous les 12 blueprints registrés', () => {
        for (const [slug, bp] of Object.entries(VERTICAL_BLUEPRINTS)) {
            const study = bp.substance ?? deriveBaselineStudy({ slug, profileId: bp.profile });
            const report = detectVerticalBlindSpots({ blueprint: bp, study });
            expect(report.scannedAt).toBeDefined();
            expect(report.scope).toBe('vertical');
            expect(report.totalRulesRun).toBeGreaterThan(0);
        }
    });

    it('détecte au moins UN gap sur au moins UN blueprint existant (utile immédiatement)', () => {
        let totalGaps = 0;
        for (const [slug, bp] of Object.entries(VERTICAL_BLUEPRINTS)) {
            const study = bp.substance ?? deriveBaselineStudy({ slug, profileId: bp.profile });
            const report = detectVerticalBlindSpots({ blueprint: bp, study });
            totalGaps += report.triggered.length;
        }
        // Preuve que le détecteur est utile sur l'existant, pas juste sur les futurs blueprints.
        expect(totalGaps).toBeGreaterThan(0);
    });
});

// ── 4. Orchestrateurs de haut niveau ────────────────────────────────────────────

describe('detectTenantBlindSpots — end-to-end', () => {
    it('produit un rapport structuré même sur profil vide', () => {
        const report = detectTenantBlindSpots({
            companyProfile: emptyCompanyProfile('Test'),
            qualification: { recommendedTier: 'L1', capabilities: {}, hardware: [] },
            study: baseStudy(),
        });
        expect(report.scope).toBe('tenant');
        expect(report.scannedAt).toBeDefined();
        expect(Array.isArray(report.triggered)).toBe(true);
    });
});
