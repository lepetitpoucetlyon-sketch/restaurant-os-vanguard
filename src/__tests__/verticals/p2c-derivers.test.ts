/**
 * 🧪 P2c — dériveurs opérationnels (Localization, Integrations, Comms, HardwareSizing).
 */

import { describe, it, expect } from 'vitest';

import { defaultAnswers } from '@/verticals/_shared/qualification';
import { emptyCompanyProfile } from '@/modules/commerce';
import { deriveLocalization } from '@/verticals/_shared/derivation/LocalizationDeriver';
import { deriveIntegrations } from '@/verticals/_shared/derivation/IntegrationsDeriver';
import { deriveComms } from '@/verticals/_shared/derivation/CommsDeriver';
import { deriveHardwareSizing } from '@/verticals/_shared/derivation/HardwareSizingDeriver';

// ── LocalizationDeriver ────────────────────────────────────────────────────────

describe('LocalizationDeriver', () => {
    it('France par défaut : fr + EUR + PCG_FR + dd/MM/yyyy', () => {
        const loc = deriveLocalization({});
        expect(loc.language).toBe('fr');
        expect(loc.currency).toBe('EUR');
        expect(loc.accountingPlan).toBe('PCG_FR');
        expect(loc.dateFormat).toBe('dd/MM/yyyy');
        expect(loc.numberFormat.decimal).toBe(',');
    });

    it('Belgique → fr-BE + PCMN_BE + Europe/Brussels', () => {
        const profile = emptyCompanyProfile('Belge');
        profile.identity.address = { country: 'BE', city: 'Bruxelles' };
        const loc = deriveLocalization({ companyProfile: profile });
        expect(loc.language).toBe('fr-BE');
        expect(loc.accountingPlan).toBe('PCMN_BE');
        expect(loc.timezone).toBe('Europe/Brussels');
    });

    it('Suisse → CHF+EUR + PC_CH + Europe/Zurich', () => {
        const profile = emptyCompanyProfile('Suisse');
        profile.identity.address = { country: 'CH', city: 'Genève' };
        const loc = deriveLocalization({ companyProfile: profile });
        expect(loc.currency).toBe('CHF');
        expect(loc.currencySecondary).toContain('EUR');
        expect(loc.accountingPlan).toBe('PC_CH');
    });

    it('UK → en + GBP + PC_GB + MM/dd/yyyy inversé', () => {
        const profile = emptyCompanyProfile('UK');
        profile.identity.address = { country: 'GB', city: 'London' };
        const loc = deriveLocalization({ companyProfile: profile });
        expect(loc.language).toBe('en');
        expect(loc.currency).toBe('GBP');
        expect(loc.numberFormat.decimal).toBe('.');
    });

    it('US → USD + IFRS + hh:mm a', () => {
        const profile = emptyCompanyProfile('US');
        profile.identity.address = { country: 'US', city: 'NYC' };
        const loc = deriveLocalization({ companyProfile: profile });
        expect(loc.currency).toBe('USD');
        expect(loc.timeFormat).toBe('hh:mm a');
    });

    it('forceLanguage bypass la détection auto', () => {
        const loc = deriveLocalization({ forceLanguage: 'ar' });
        expect(loc.language).toBe('ar');
    });

    it('invoiceNumbering utilise SIREN si dispo', () => {
        const profile = emptyCompanyProfile('X');
        profile.identity.siren = '123456789';
        const loc = deriveLocalization({ companyProfile: profile });
        expect(loc.invoiceNumbering).toContain('1234');
    });
});

// ── IntegrationsDeriver ────────────────────────────────────────────────────────

describe('IntegrationsDeriver', () => {
    it('resto avec mod_pos → Stripe (petit) ou Adyen (gros)', () => {
        const smallResto = deriveIntegrations({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true },
        });
        expect(smallResto.primaryPaymentGateway?.provider).toBe('Stripe');

        const bigResto = deriveIntegrations({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' },
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true },
        });
        expect(bigResto.primaryPaymentGateway?.provider).toContain('Adyen');
    });

    it('mod_treasury → banking suggéré (Qonto par défaut)', () => {
        const res = deriveIntegrations({
            answers: defaultAnswers(),
            variant: 'retail',
            effectiveCapabilities: { mod_treasury: true },
        });
        expect(res.banking?.provider).toBe('Qonto (défaut PME)');
    });

    it('clinic + mod_reservations → Doctolib priorité 1', () => {
        const res = deriveIntegrations({
            answers: defaultAnswers(),
            variant: 'clinic',
            effectiveCapabilities: { mod_reservations: true },
        });
        const doctolib = res.integrations.find(i => i.provider === 'Doctolib');
        expect(doctolib?.priority).toBe(1);
    });

    it('hotel → Booking.com priorité 1 + Expedia', () => {
        const res = deriveIntegrations({
            answers: defaultAnswers(),
            variant: 'hotel',
            effectiveCapabilities: { mod_reservations: true },
        });
        const providers = res.integrations.map(i => i.provider);
        expect(providers).toContain('Booking.com');
        expect(providers).toContain('Expedia');
    });

    it('resto + omnichannel → Uber Eats + Deliveroo', () => {
        const res = deriveIntegrations({
            answers: defaultAnswers(),
            variant: 'restaurant',
            effectiveCapabilities: { mod_omnichannel: true },
        });
        const providers = res.integrations.map(i => i.provider);
        expect(providers).toContain('Uber Eats');
        expect(providers).toContain('Deliveroo');
    });

    it('scale=pme → SILAE + PayFit suggérés', () => {
        const res = deriveIntegrations({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' },
            variant: 'retail',
            effectiveCapabilities: {},
        });
        const providers = res.integrations.map(i => i.provider);
        expect(providers).toContain('SILAE');
        expect(providers).toContain('PayFit');
    });
});

// ── CommsDeriver ───────────────────────────────────────────────────────────────

describe('CommsDeriver', () => {
    it('mod_pos → template tx.receipt (ticket dématérialisé)', () => {
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_pos: true },
        });
        const receipt = comms.transactionalTemplates.find(t => t.id === 'tx.receipt');
        expect(receipt).toBeDefined();
        expect(receipt!.requiresConsent).toBe(false);
    });

    it('mod_reservations → confirmation + rappel SMS', () => {
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'salon',
            effectiveCapabilities: { mod_reservations: true },
        });
        const ids = comms.transactionalTemplates.map(t => t.id);
        expect(ids).toContain('tx.booking_confirmation');
        expect(ids).toContain('tx.booking_reminder');
    });

    it('clinic → template rappel vaccinal', () => {
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'clinic',
            effectiveCapabilities: {},
        });
        expect(comms.transactionalTemplates.find(t => t.id === 'tx.vaccine_reminder')).toBeDefined();
    });

    it('mod_marketing → templates marketing avec requiresConsent=true (Loi 2004)', () => {
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_marketing: true },
        });
        expect(comms.marketingTemplates.length).toBeGreaterThan(0);
        expect(comms.marketingTemplates.every(t => t.requiresConsent)).toBe(true);
        expect(comms.respectLoi2004).toBe(true);
    });

    it('scale=eti → alertes critical sur Teams + webhook + push', () => {
        const comms = deriveComms({
            answers: { ...defaultAnswers(), axis1_scale: 'eti' },
            variant: 'retail',
            effectiveCapabilities: {},
        });
        expect(comms.alertChannels.critical).toContain('teams');
        expect(comms.alertChannels.critical).toContain('webhook');
        expect(comms.alertChannels.critical).toContain('push');
    });

    it('scale=solo → email suffit sauf critical (SMS ajouté)', () => {
        const comms = deriveComms({
            answers: { ...defaultAnswers(), axis1_scale: 'solo' },
            variant: 'retail',
            effectiveCapabilities: {},
        });
        expect(comms.alertChannels.critical).toEqual(['sms', 'email']);
        expect(comms.alertChannels.normal).toEqual(['email']);
    });

    it('branding vient du CompanyProfile.branding scrapé', () => {
        const profile = emptyCompanyProfile('MaMarque');
        profile.branding.primaryColor = '#7B2D26';
        profile.branding.logoUrl = 'https://x.com/logo.png';
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: {}, companyProfile: profile,
        });
        expect(comms.brandingApplied.primaryColor).toBe('#7B2D26');
        expect(comms.brandingApplied.logoUrl).toBe('https://x.com/logo.png');
        expect(comms.brandingApplied.name).toBe('MaMarque');
    });

    it('mod_haccp → alerte SMS immédiate (24/7)', () => {
        const comms = deriveComms({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: { mod_haccp: true },
        });
        const alert = comms.transactionalTemplates.find(t => t.id === 'tx.haccp_alert');
        expect(alert?.primaryChannel).toBe('sms');
    });
});

// ── HardwareSizingDeriver ──────────────────────────────────────────────────────

describe('HardwareSizingDeriver', () => {
    it('mod_pos + staff=25 → 4 postes (25/8=ceil→4)', () => {
        const hw = deriveHardwareSizing({
            answers: { ...defaultAnswers(), axis1_scale: 'pme', axis1_estimatedStaff: 25 },
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true },
        });
        expect(hw.posStations).toBe(4);
        expect(hw.tpeCount).toBe(4);
    });

    it('multi-site multiplie posStations par siteCount', () => {
        const hw = deriveHardwareSizing({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true },
            siteCount: 3,
        });
        expect(hw.posStations).toBe(3);  // 1 poste × 3 sites
    });

    it('mod_haccp + catalog périssable → sondes température calculées', () => {
        const profile = emptyCompanyProfile('Poissonnier');
        for (let i = 0; i < 40; i++) {
            profile.catalog.push({ id: `p${i}`, name: `Poisson ${i}`, description: '', priceInMicrounits: 1_000_000 as never,
                taxRate: 0.055, category: 'Poisson', isAvailable: true });
        }
        const hw = deriveHardwareSizing({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: { mod_haccp: true }, companyProfile: profile,
        });
        // 40 items périssables / 20 = 2 frigos min
        expect(hw.temperatureProbes).toBeGreaterThanOrEqual(2);
    });

    it('clinic → onduleur requis', () => {
        const hw = deriveHardwareSizing({
            answers: defaultAnswers(), variant: 'clinic', effectiveCapabilities: {},
        });
        expect(hw.upsRequired).toBe(true);
    });

    it('mod_kiosk → borne kiosk + bande passante augmentée', () => {
        const hw = deriveHardwareSizing({
            answers: defaultAnswers(), variant: 'restaurant',
            effectiveCapabilities: { mod_kiosk: true },
        });
        expect(hw.kioskTerminals).toBeGreaterThanOrEqual(1);
        expect(hw.bandwidthMbps).toBeGreaterThan(50);
    });

    it('eti → bande passante ≥ 500 Mbps', () => {
        const hw = deriveHardwareSizing({
            answers: { ...defaultAnswers(), axis1_scale: 'eti' },
            variant: 'retail', effectiveCapabilities: {},
        });
        expect(hw.bandwidthMbps).toBeGreaterThanOrEqual(500);
    });

    it('coût matériel calculé (indicatif)', () => {
        const hw = deriveHardwareSizing({
            answers: { ...defaultAnswers(), axis1_scale: 'pme' },
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true, mod_kds: true, mod_haccp: true },
        });
        expect(hw.estimatedHardwareCostEur).toBeGreaterThan(0);
    });

    it('mod_inventory → scanners barcode >= 1', () => {
        const hw = deriveHardwareSizing({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_inventory: true },
        });
        expect(hw.barcodeScanners).toBeGreaterThanOrEqual(1);
    });
});
