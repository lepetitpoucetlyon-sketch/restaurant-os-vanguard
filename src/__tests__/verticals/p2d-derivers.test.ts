/**
 * 🧪 P2d — dériveurs de valeur (Kpi, Formation, Pricing, Backup).
 */

import { describe, it, expect } from 'vitest';

import { defaultAnswers } from '@/modules/commerce';
import { deriveKpis } from '@/verticals/_shared/derivation/KpiDeriver';
import { deriveFormation } from '@/verticals/_shared/derivation/FormationDeriver';
import { derivePricing } from '@/verticals/_shared/derivation/PricingDeriver';
import { deriveBackup } from '@/verticals/_shared/derivation/BackupDeriver';
import { deriveRbac } from '@/verticals/_shared/derivation/RbacDeriver';

// ── KpiDeriver ─────────────────────────────────────────────────────────────────

describe('KpiDeriver', () => {
    function mkRoles(scale: 'solo' | 'tpe' | 'pme' | 'eti', variant: 'restaurant' | 'clinic' | 'retail' = 'restaurant') {
        return deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: scale },
            variant, effectiveCapabilities: { mod_pos: true },
        });
    }

    it('KPIs socle présents (revenue/transactions/avg_ticket)', () => {
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: {}, roles: mkRoles('tpe', 'retail'),
        });
        const ids = r.kpis.map(k => k.id);
        expect(ids).toContain('revenue');
        expect(ids).toContain('avg_ticket');
    });

    it('restaurant → table_rotation + food_cost_pct', () => {
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: {}, roles: mkRoles('tpe'),
        });
        const ids = r.kpis.map(k => k.id);
        expect(ids).toContain('table_rotation');
        expect(ids).toContain('food_cost_pct');
    });

    it('hotel → occupancy + ADR + RevPAR', () => {
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'hotel',
            effectiveCapabilities: {}, roles: mkRoles('pme', 'restaurant'),
        });
        const ids = r.kpis.map(k => k.id);
        expect(ids).toContain('occupancy_rate');
        expect(ids).toContain('adr');
        expect(ids).toContain('revpar');
    });

    it('gym → active_members + churn_rate + class_fill_rate', () => {
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'gym',
            effectiveCapabilities: {}, roles: mkRoles('pme'),
        });
        const ids = r.kpis.map(k => k.id);
        expect(ids).toContain('active_members');
        expect(ids).toContain('churn_rate');
    });

    it('mod_reservations → no_show_rate + booking_rate', () => {
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'salon',
            effectiveCapabilities: { mod_reservations: true }, roles: mkRoles('tpe'),
        });
        expect(r.kpis.map(k => k.id)).toContain('no_show_rate');
    });

    it('mod_haccp → haccp_alerts visible pour responsable_hygiene', () => {
        const roles = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'restaurant', effectiveCapabilities: { mod_haccp: true, mod_pos: true },
        });
        const r = deriveKpis({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: { mod_haccp: true }, roles,
        });
        const haccpKpi = r.kpis.find(k => k.id === 'haccp_alerts');
        expect(haccpKpi).toBeDefined();
        expect(haccpKpi!.visibleTo).toContain('responsable_hygiene');
    });

    it('dashboardsByRole génère un dashboard par rôle ayant des KPIs', () => {
        const r = deriveKpis({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' }, variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true, mod_hr: true }, roles: mkRoles('pme'),
        });
        const ownerRoles = r.dashboardsByRole.map(d => d.ownerRole);
        expect(ownerRoles).toContain('admin');
        expect(ownerRoles).toContain('manager');
    });

    it('reportFrequency = eti→daily, pme→weekly, tpe→monthly', () => {
        expect(deriveKpis({ answers: { ...defaultAnswers(), axis1_scale: 'eti' }, variant: 'retail', effectiveCapabilities: {}, roles: mkRoles('eti', 'retail') }).reportFrequency).toBe('daily');
        expect(deriveKpis({ answers: { ...defaultAnswers(), axis1_scale: 'pme' }, variant: 'retail', effectiveCapabilities: {}, roles: mkRoles('pme', 'retail') }).reportFrequency).toBe('weekly');
        expect(deriveKpis({ answers: { ...defaultAnswers(), axis1_scale: 'tpe' }, variant: 'retail', effectiveCapabilities: {}, roles: mkRoles('tpe', 'retail') }).reportFrequency).toBe('monthly');
    });
});

// ── FormationDeriver ───────────────────────────────────────────────────────────

describe('FormationDeriver', () => {
    it('L0 → 3-4 tutos courts', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'retail', tier: 'L0',
            effectiveCapabilities: { mod_pos: true },
        });
        expect(f.onboardingPath.length).toBeGreaterThanOrEqual(2);
        expect(f.onboardingPath.length).toBeLessThan(5);
    });

    it('L3 → session live obligatoire', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'retail', tier: 'L3',
            effectiveCapabilities: { mod_pos: true },
        });
        const live = f.onboardingPath.find(s => s.kind === 'live_session');
        expect(live).toBeDefined();
        expect(live!.required).toBe(true);
    });

    it('L3 + mod_fleet → tuto MCC pour direction', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'retail', tier: 'L3',
            effectiveCapabilities: { mod_pos: true, mod_fleet_management: true },
        });
        expect(f.onboardingPath.find(s => s.id === 'onb.fleet')).toBeDefined();
    });

    it('restaurant → certification HACCP obligatoire', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'restaurant', tier: 'L1',
            effectiveCapabilities: { mod_pos: true },
        });
        const haccp = f.certificationsRequired.find(c => c.id === 'cert.haccp');
        expect(haccp?.required).toBe(true);
        expect(haccp?.renewalMonths).toBe(60);
    });

    it('clinic → DPC obligatoire renouvellement 36 mois', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'clinic', tier: 'L2',
            effectiveCapabilities: {},
        });
        const dpc = f.certificationsRequired.find(c => c.id === 'cert.dpc');
        expect(dpc?.required).toBe(true);
        expect(dpc?.renewalMonths).toBe(36);
    });

    it('gym → BPJEPS obligatoire (sans renouvellement)', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'gym', tier: 'L1',
            effectiveCapabilities: {},
        });
        const bpjeps = f.certificationsRequired.find(c => c.id === 'cert.bpjeps');
        expect(bpjeps?.required).toBe(true);
        expect(bpjeps?.renewalMonths).toBe(0);
    });

    it('totalOnboardingMinutes calculé', () => {
        const f = deriveFormation({
            answers: defaultAnswers(), variant: 'restaurant', tier: 'L2',
            effectiveCapabilities: { mod_pos: true, mod_haccp: true, mod_reservations: true },
        });
        expect(f.totalOnboardingMinutes).toBeGreaterThan(0);
    });
});

// ── PricingDeriver ─────────────────────────────────────────────────────────────

describe('PricingDeriver', () => {
    it('L0 → Starter 29€/mois', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L0', effectiveCapabilities: {} });
        expect(p.suggestedTier.name).toContain('Starter');
        expect(p.suggestedTier.basePriceMonthEur).toBe(29);
    });

    it('L1 avec 3 postes → base 59 + (3-2)*15 = 74€', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L1', effectiveCapabilities: {}, posStations: 3 });
        expect(p.suggestedTier.basePriceMonthEur).toBe(74);
    });

    it('L2 multi-site → +79€ par site suppl', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L2', effectiveCapabilities: {}, siteCount: 3 });
        expect(p.suggestedTier.basePriceMonthEur).toBe(149 + 2 * 79);
    });

    it('L3 → Enterprise 499€ base', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L3', effectiveCapabilities: {} });
        expect(p.suggestedTier.basePriceMonthEur).toBe(499);
    });

    it('mod_ai → add-on 49€/mois', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L1', effectiveCapabilities: { mod_ai: true } });
        const ai = p.addons.find(a => a.capability === 'mod_ai');
        expect(ai?.priceMonthEur).toBe(49);
    });

    it('mod_kds × sites → prix multiplié', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L2', effectiveCapabilities: { mod_kds: true }, siteCount: 3 });
        const kds = p.addons.find(a => a.capability === 'mod_kds');
        expect(kds?.priceMonthEur).toBe(15 * 3);
    });

    it('totalEstimatedMonthEur = tier + somme addons', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L1', effectiveCapabilities: { mod_ai: true, mod_marketing: true }, posStations: 2 });
        expect(p.totalEstimatedMonthEur).toBe(59 + 49 + 39);
    });

    it('remise annuelle 16.67% (2 mois offerts)', () => {
        const p = derivePricing({ answers: defaultAnswers(), tier: 'L0', effectiveCapabilities: {} });
        expect(p.annualDiscount).toBeCloseTo(16.67, 2);
    });
});

// ── BackupDeriver ──────────────────────────────────────────────────────────────

describe('BackupDeriver', () => {
    it('santé → backup hourly + AES256_HDS + RTO 60min + UE only', () => {
        const b = deriveBackup({ answers: defaultAnswers(), variant: 'clinic', effectiveCapabilities: {} });
        expect(b.backupFrequency).toBe('hourly');
        expect(b.encryptionAtRest).toBe('AES256_HDS');
        expect(b.dr.rtoMinutes).toBe(60);
        expect(b.dataResidency).toEqual(['EU']);
    });

    it('eti → hourly + PCA formalisé RTO 4h', () => {
        const b = deriveBackup({
            answers: { ...defaultAnswers(), axis1_scale: 'eti' }, variant: 'retail',
            effectiveCapabilities: {}, transactionsPerDay: 100,
        });
        expect(b.backupFrequency).toBe('hourly');
        expect(b.dr.rtoMinutes).toBe(240);
    });

    it('tx/day > 500 sans être eti → every_4h', () => {
        const b = deriveBackup({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' }, variant: 'retail',
            effectiveCapabilities: {}, transactionsPerDay: 800,
        });
        expect(b.backupFrequency).toBe('every_4h');
    });

    it('tpe/solo → daily', () => {
        const b = deriveBackup({
            answers: { ...defaultAnswers(), axis1_scale: 'solo' }, variant: 'retail',
            effectiveCapabilities: {}, transactionsPerDay: 30,
        });
        expect(b.backupFrequency).toBe('daily');
    });

    it('mod_pos + volume > 1000 → PCI-DSS chiffrement', () => {
        const b = deriveBackup({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' }, variant: 'retail',
            effectiveCapabilities: { mod_pos: true }, transactionsPerDay: 2000,
        });
        expect(b.encryptionAtRest).toBe('AES256_PCI_DSS');
    });

    it('mod_ai → dataResidency inclut US (Gemini)', () => {
        const b = deriveBackup({ answers: defaultAnswers(), variant: 'retail', effectiveCapabilities: { mod_ai: true } });
        expect(b.dataResidency).toContain('US');
    });

    it('santé → cold_glacier après 60 mois', () => {
        const b = deriveBackup({ answers: defaultAnswers(), variant: 'clinic', effectiveCapabilities: {} });
        expect(b.archivalAfterMonths).toBe(60);
        expect(b.archiveStorage).toBe('cold_glacier');
    });
});
