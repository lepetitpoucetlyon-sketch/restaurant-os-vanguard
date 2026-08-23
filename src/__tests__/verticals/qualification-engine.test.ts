/**
 * 🧪 QualificationEngine — P2a (wizard 7 axes + auto-inférence + dériveurs).
 *
 * Couvre :
 *  1. inferAnswers depuis CompanyProfile + SectorStudy (auto-remplissage).
 *  2. calibrateDepth : solo→L0, tpe→L1, pme→L2, eti/franchise→L3.
 *  3. resolveCapabilitiesFromAnswers : traduction answers → capabilities + hardware.
 *  4. RbacDeriver : rôles auto par échelle + variant + capabilities.
 *  5. BusinessLawsDeriver : TVA, devise, timezone, HCR, alcool.
 *  6. resolve end-to-end : produit un QualificationProfile complet.
 */

import { describe, it, expect } from 'vitest';

import {
    QualificationEngine,
    resolveQualification,
    defaultAnswers,
    calibrateDepth,
    inferAnswers,
    resolveCapabilitiesFromAnswers,
    type QualificationAnswers,
} from '@/modules/commerce';
import { emptyCompanyProfile } from '@/modules/commerce';
import { deriveRbac } from '@/verticals/_shared/derivation/RbacDeriver';
import { deriveBusinessLaws } from '@/verticals/_shared/derivation/BusinessLawsDeriver';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';

function baseStudy(overrides: Partial<SectorStudy> = {}): SectorStudy {
    return {
        vertical: 'restaurant',
        summary: 'Étude test',
        workflows: [], regulations: [], hardware: [], kpis: [],
        businessRules: [], integrations: [], confidence: 0.5,
        ...overrides,
    };
}

// ── 1. inferAnswers ────────────────────────────────────────────────────────────

describe('inferAnswers — auto-remplissage depuis signaux', () => {
    it('infère axis1_scale=eti si multi-site avec ≥ 10 sites', () => {
        const profile = emptyCompanyProfile('Franchise');
        profile.scale = { multiSite: true, siteCount: 15, evidence: ['15 boutiques'] };
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis1_scale).toBe('eti');
        expect(inferred.axis1_topology).toBe('franchise');
        expect(inferred.axis1_siteCount).toBe(15);
    });

    it('infère axis1_scale=solo si estimatedStaff = 1', () => {
        const profile = emptyCompanyProfile('Solo');
        profile.scale = { estimatedStaff: 1, evidence: [] };
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis1_scale).toBe('solo');
    });

    it('infère axis4_stockNature=perishable si catalogue contient produits frais', () => {
        const profile = emptyCompanyProfile('Poissonnier');
        profile.catalog.push({
            id: 'p1', name: 'Saumon frais', description: '', priceInMicrounits: 25_000_000 as never,
            taxRate: 0.055, category: 'Poisson', isAvailable: true,
        });
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis4_stockNature).toBe('perishable');
    });

    it('infère axis6_regulations=[haccp] si study mentionne HACCP', () => {
        const study = baseStudy({ regulations: [{ id: 'haccp', label: 'HACCP PMS', description: '' }] });
        const profile = emptyCompanyProfile('X');
        const inferred = inferAnswers(profile, study);
        expect(inferred.axis6_regulations).toContain('haccp');
    });

    it('infère axis6_regulations=[rgpd_sensitive] pour clinic/veterinary', () => {
        const profile = emptyCompanyProfile('Clinique');
        profile.sectorSignals.detectedVariant = 'clinic';
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis6_regulations).toContain('rgpd_sensitive');
    });

    it('infère axis2_commerceModel=subscriptions si catalogue contient abonnements', () => {
        const profile = emptyCompanyProfile('Gym');
        profile.catalog.push({
            id: 'ab', name: 'Abonnement mensuel illimité', description: '',
            priceInMicrounits: 49_000_000 as never, taxRate: 0.20, category: 'Pass', isAvailable: true,
        });
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis2_commerceModel).toBe('subscriptions');
    });

    it('ne devine rien si aucun signal (Partial vide sur les autres axes)', () => {
        const profile = emptyCompanyProfile('X');
        const inferred = inferAnswers(profile, baseStudy());
        expect(inferred.axis3_timeTracking).toBeUndefined();
        expect(inferred.axis5_posHardware).toBeUndefined();
    });
});

// ── 2. calibrateDepth ──────────────────────────────────────────────────────────

describe('calibrateDepth — tier proposé', () => {
    it('solo → L0', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'solo' };
        expect(calibrateDepth(a)).toBe('L0');
    });
    it('tpe → L1', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'tpe' };
        expect(calibrateDepth(a)).toBe('L1');
    });
    it('pme → L2', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'pme' };
        expect(calibrateDepth(a)).toBe('L2');
    });
    it('eti → L3', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'eti' };
        expect(calibrateDepth(a)).toBe('L3');
    });
    it('franchise force L3 même sur tpe', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'tpe', axis1_topology: 'franchise' };
        expect(calibrateDepth(a)).toBe('L3');
    });
    it('paie modulée escalade solo/tpe en L2', () => {
        const a: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'solo', axis3_payrollComplexity: 'modulation' };
        expect(calibrateDepth(a)).toBe('L2');
    });
});

// ── 3. resolveCapabilitiesFromAnswers ──────────────────────────────────────────

describe('resolveCapabilitiesFromAnswers — traduction answers → capabilities', () => {
    it('active mod_hr dès tpe', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis1_scale: 'tpe' });
        expect(capabilities.mod_hr).toBe(true);
    });

    it('active mod_fleet_management pour eti', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis1_scale: 'eti' });
        expect(capabilities.mod_fleet_management).toBe(true);
    });

    it('active mod_kds + mod_pos si production=kds_screens', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis5_production: 'kds_screens' });
        expect(capabilities.mod_kds).toBe(true);
        expect(capabilities.mod_pos).toBe(true);
    });

    it('active mod_haccp + mod_inventory si stock=perishable', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis4_stockNature: 'perishable' });
        expect(capabilities.mod_haccp).toBe(true);
        expect(capabilities.mod_inventory).toBe(true);
        expect(capabilities.mod_kitchen_management).toBe(true);
    });

    it('active mod_rgpd si régulation rgpd_sensitive cochée', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis6_regulations: ['rgpd_sensitive'] });
        expect(capabilities.mod_rgpd).toBe(true);
    });

    it('mod_kitchen_management pull mod_pos via CapabilityCatalog.dependsOn', () => {
        const { capabilities } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis4_stockNature: 'raw_recipes' });
        // kitchen_management dépend de mod_pos (dans le catalogue)
        expect(capabilities.mod_kitchen_management).toBe(true);
        expect(capabilities.mod_pos).toBe(true);
    });

    it('remonte des FeatureSuggestion avec evidence pour l\'opérateur', () => {
        const { suggestedFeatures } = resolveCapabilitiesFromAnswers({ ...defaultAnswers(), axis4_stockNature: 'perishable' });
        const haccpSug = suggestedFeatures.find(s => s.capability === 'mod_haccp');
        expect(haccpSug).toBeDefined();
        expect(haccpSug!.evidence.length).toBeGreaterThan(0);
    });
});

// ── 4. RbacDeriver ─────────────────────────────────────────────────────────────

describe('RbacDeriver — rôles auto-calculés', () => {
    it('solo → 1 seul rôle admin', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'solo' },
            variant: 'restaurant', effectiveCapabilities: { mod_pos: true },
        });
        expect(template.roles.filter(r => r.tier === 'admin')).toHaveLength(1);
        expect(template.roles.every(r => r.key !== 'chef_cuisine')).toBe(true); // pas de rôles sectoriels en solo
        expect(template.passwordPolicy).toBe('basic');
    });

    it('tpe restaurant → admin + operator + serveur/chef/… + password strong si rbac=standard', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe', axis1_rbac: 'standard' },
            variant: 'restaurant', effectiveCapabilities: { mod_pos: true },
        });
        const keys = template.roles.map(r => r.key);
        expect(keys).toContain('admin');
        expect(keys).toContain('operator');
        expect(keys).toContain('chef_cuisine');
        expect(keys).toContain('serveur');
        expect(template.passwordPolicy).toBe('strong');
    });

    it('eti → matrice fine avec direction + MFA partout + password strict', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'eti', axis1_rbac: 'granular' },
            variant: 'retail', effectiveCapabilities: { mod_pos: true },
        });
        const keys = template.roles.map(r => r.key);
        expect(keys).toContain('direction');
        expect(keys).toContain('manager');
        expect(keys).toContain('stagiaire');
        expect(template.mfaRequiredFor.length).toBe(template.roles.length); // MFA partout
        expect(template.passwordPolicy).toBe('strict');
    });

    it('franchise → franchise_admin + rootAdminRole=franchise_admin', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'eti', axis1_topology: 'franchise' },
            variant: 'bakery', effectiveCapabilities: { mod_pos: true },
            siteCount: 15,
        });
        const keys = template.roles.map(r => r.key);
        expect(keys).toContain('franchise_admin');
        expect(keys).toContain('regional_manager');
        expect(keys).toContain('site_manager');
        expect(template.rootAdminRole).toBe('franchise_admin');
    });

    it('mod_haccp ON force la présence d\'un responsable_hygiene', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'restaurant', effectiveCapabilities: { mod_haccp: true, mod_pos: true },
        });
        expect(template.roles.find(r => r.key === 'responsable_hygiene')).toBeDefined();
    });

    it('variant clinic → rôles praticien/assistant/accueil', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' },
            variant: 'clinic', effectiveCapabilities: { mod_pos: true, mod_reservations: true },
        });
        const keys = template.roles.map(r => r.key);
        expect(keys).toContain('praticien');
        expect(keys).toContain('assistant_medical');
        expect(keys).toContain('accueil');
    });

    it('chaque rôle porte sa derivedFrom (audit trail)', () => {
        const template = deriveRbac({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'restaurant', effectiveCapabilities: { mod_pos: true },
        });
        for (const r of template.roles) {
            expect(r.derivedFrom.length).toBeGreaterThan(0);
        }
    });
});

// ── 5. BusinessLawsDeriver ────────────────────────────────────────────────────

describe('BusinessLawsDeriver — logique métier auto-calculée', () => {
    it('resto FR → HCR 39h + nuit dès 22h + witness_dish_days=5 + frying_oil 7j', () => {
        const laws = deriveBusinessLaws({ answers: defaultAnswers(), variant: 'restaurant' });
        expect(laws.overtime_threshold_hours).toBe(39);
        expect(laws.night_rate_start_hour).toBe(22);
        expect(laws.witness_dish_days).toBe(5);
        expect(laws.frying_oil_change_days).toBe(7);
    });

    it('TVA franchise_base → 0% partout', () => {
        const laws = deriveBusinessLaws({
            answers: { ...defaultAnswers(), axis2_vatRegime: 'franchise_base' },
            variant: 'retail',
        });
        expect(laws.tax_rate_default).toBe(0);
    });

    it('TVA multi_rate + catalogue scrapé → map de taux par catégorie', () => {
        const profile = emptyCompanyProfile('Bar');
        profile.catalog.push(
            { id: 'v', name: 'Vin', description: '', priceInMicrounits: 8_000_000 as never, taxRate: 0.20, category: 'Boissons', isAvailable: true },
            { id: 'p', name: 'Plat', description: '', priceInMicrounits: 18_000_000 as never, taxRate: 0.10, category: 'Plats', isAvailable: true },
        );
        const laws = deriveBusinessLaws({
            answers: { ...defaultAnswers(), axis2_vatRegime: 'multi_rate' },
            variant: 'restaurant',
            companyProfile: profile,
        });
        expect(laws.tax_rate_map['Boissons']).toBe(0.20);
        expect(laws.tax_rate_map['Plats']).toBe(0.10);
    });

    it('country=CH → CHF+EUR + timezone Europe/Zurich', () => {
        const profile = emptyCompanyProfile('SwissCo');
        profile.identity.address = { country: 'CH', city: 'Genève' };
        const laws = deriveBusinessLaws({ answers: defaultAnswers(), variant: 'restaurant', companyProfile: profile });
        expect(laws.currency).toBe('CHF');
        expect(laws.currency_secondary).toContain('EUR');
        expect(laws.timezone).toBe('Europe/Zurich');
    });

    it('country=GB → GBP + fiscal year avril', () => {
        const profile = emptyCompanyProfile('UKCo');
        profile.identity.address = { country: 'GB', city: 'London' };
        const laws = deriveBusinessLaws({ answers: defaultAnswers(), variant: 'retail', companyProfile: profile });
        expect(laws.currency).toBe('GBP');
        expect(laws.fiscal_year_start_month).toBe(4);
    });

    it('alcool détecté → alcohol_service_hours + age_restrictions.alcohol=18', () => {
        const profile = emptyCompanyProfile('Bar');
        profile.catalog.push({
            id: 'v', name: 'Cocktail signature', description: '', priceInMicrounits: 12_000_000 as never,
            taxRate: 0.20, category: 'Boissons', isAvailable: true,
        });
        const laws = deriveBusinessLaws({ answers: defaultAnswers(), variant: 'restaurant', companyProfile: profile });
        expect(laws.alcohol_service_hours).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
        expect(laws.age_restrictions['alcohol']).toBe(18);
    });

    it('node_capacity scale avec échelle × taille catalogue', () => {
        const profile = emptyCompanyProfile('Big');
        for (let i = 0; i < 150; i++) {
            profile.catalog.push({ id: `p${i}`, name: `Item ${i}`, description: '', priceInMicrounits: 1_000_000 as never, taxRate: 0.20, category: 'X', isAvailable: true });
        }
        const laws = deriveBusinessLaws({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' },
            variant: 'retail', companyProfile: profile,
        });
        // base pme=250, mult catalog>100 = 1.5 → ~375
        expect(laws.node_capacity).toBe(375);
    });

    it('every derived value has an entry in derivedFrom (audit)', () => {
        const laws = deriveBusinessLaws({ answers: defaultAnswers(), variant: 'restaurant' });
        expect(laws.derivedFrom['node_capacity']).toBeDefined();
        expect(laws.derivedFrom['tax_rate_default']).toBeDefined();
        expect(laws.derivedFrom['currency']).toBeDefined();
        expect(laws.derivedFrom['timezone']).toBeDefined();
    });
});

// ── 6. resolve end-to-end ─────────────────────────────────────────────────────

describe('resolve — orchestrateur end-to-end', () => {
    it('produit un QualificationProfile complet (tier + caps + roles + laws)', () => {
        const answers: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'pme', axis4_stockNature: 'perishable' };
        const profile = resolveQualification({
            answers,
            variant: 'restaurant',
        });
        expect(profile.recommendedTier).toBe('L2');
        expect(profile.capabilities.mod_haccp).toBe(true);
        expect(profile.roles.roles.length).toBeGreaterThan(0);
        expect(profile.businessLaws.overtime_threshold_hours).toBe(39);
        expect(profile.displayDepthDefault).toBe('manager');
        expect(profile.derivedAt).toBeDefined();
    });

    it('exporte via le module barrel @/modules/commerce', () => {
        expect(QualificationEngine.resolve).toBeDefined();
        expect(QualificationEngine.inferAnswers).toBeDefined();
        expect(QualificationEngine.calibrateDepth).toBeDefined();
    });
});
