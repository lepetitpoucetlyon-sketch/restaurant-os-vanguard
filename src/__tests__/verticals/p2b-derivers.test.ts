/**
 * 🧪 P2b — dériveurs conformité (RGPD, Security, Legal).
 *
 * Couvre pour chaque dériveur :
 *  - cas typiques par secteur (santé strict, resto standard, retail léger).
 *  - déclenchement des règles clés (DPO obligatoire, PIA, MFA cascade, contrats).
 *  - audit trail présent partout (derivedFrom peuplé).
 */

import { describe, it, expect } from 'vitest';

import { defaultAnswers, type QualificationAnswers } from '@/modules/commerce';
import { deriveRgpd } from '@/verticals/_shared/derivation/RgpdDeriver';
import { deriveSecurity } from '@/verticals/_shared/derivation/SecurityDeriver';
import { deriveLegal } from '@/verticals/_shared/derivation/LegalDeriver';

// ── RgpdDeriver ────────────────────────────────────────────────────────────────

describe('RgpdDeriver', () => {
    it('secteur santé (clinic) → PIA + DPO obligatoires + dossiers_patients 20 ans', () => {
        const rgpd = deriveRgpd({
            answers: defaultAnswers(),
            variant: 'clinic',
            effectiveCapabilities: { mod_customer: true, mod_reservations: true },
            estimatedStaff: 10,
        });
        expect(rgpd.piaRequired).toBe(true);
        expect(rgpd.piaReasons.some(r => /santé|Art\. 9/.test(r))).toBe(true);
        expect(rgpd.dpoRequired).toBe(true);
        expect(rgpd.retentionByCategory['dossiers_patients']).toBe(240);
        expect(rgpd.registerOfProcessing.some(p => p.isSensitive)).toBe(true);
    });

    it('effectif > 250 → DPO obligatoire même hors secteur sensible', () => {
        const rgpd = deriveRgpd({
            answers: { ...defaultAnswers(), axis1_scale: 'eti' },
            variant: 'retail',
            effectiveCapabilities: {},
            estimatedStaff: 400,
        });
        expect(rgpd.dpoRequired).toBe(true);
        expect(rgpd.dpoReasons.some(r => /> 250/.test(r))).toBe(true);
    });

    it('pointage biométrique/géolocalisé → PIA obligatoire', () => {
        const rgpd = deriveRgpd({
            answers: { ...defaultAnswers(), axis3_timeTracking: 'biometric_geo' },
            variant: 'garage',
            effectiveCapabilities: { mod_timeclock: true },
        });
        expect(rgpd.piaRequired).toBe(true);
        expect(rgpd.piaReasons.some(r => /biométrique|géolocalisé/.test(r))).toBe(true);
    });

    it('registre des traitements généré depuis les capabilities activées', () => {
        const rgpd = deriveRgpd({
            answers: defaultAnswers(),
            variant: 'restaurant',
            effectiveCapabilities: { mod_pos: true, mod_customer: true, mod_marketing: true, mod_hr: true },
        });
        const ids = rgpd.registerOfProcessing.map(p => p.id);
        expect(ids).toContain('proc.pos');
        expect(ids).toContain('proc.customer');
        expect(ids).toContain('proc.marketing');
        expect(ids).toContain('proc.hr');
        // Marketing → base légale = consent
        expect(rgpd.registerOfProcessing.find(p => p.id === 'proc.marketing')!.legalBasis).toBe('consent');
        // POS → obligation légale
        expect(rgpd.registerOfProcessing.find(p => p.id === 'proc.pos')!.legalBasis).toBe('legal_obligation');
    });

    it('cookie banner requis si analytics OU marketing activés', () => {
        const rgpd = deriveRgpd({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_google_analytics: true },
        });
        expect(rgpd.cookieBanner.required).toBe(true);
        expect(rgpd.cookieBanner.categories).toContain('analytics');
    });

    it('sous-traitants listés : Gemini si mod_ai, Google si analytics, plateforme toujours', () => {
        const rgpd = deriveRgpd({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_ai: true, mod_google_analytics: true },
        });
        const names = rgpd.subProcessors.map(s => s.name);
        expect(names).toContain('Google Gemini API');
        expect(names).toContain('Google Analytics');
        expect(names).toContain('RESTAURANT-OS-CORE');
    });

    it('rétention comptable = 120 mois (10 ans NF525)', () => {
        const rgpd = deriveRgpd({ answers: defaultAnswers(), variant: 'retail', effectiveCapabilities: {} });
        expect(rgpd.retentionByCategory['transactions_comptables']).toBe(120);
    });
});

// ── SecurityDeriver ────────────────────────────────────────────────────────────

describe('SecurityDeriver', () => {
    it('secteur santé → session 15min strict', () => {
        const sec = deriveSecurity({ answers: defaultAnswers(), variant: 'clinic' });
        expect(sec.session_timeout_min).toBe(15);
    });

    it('eti + rbac granular → password strict 14 chars + rotation 90j + historique 12', () => {
        const answers: QualificationAnswers = { ...defaultAnswers(), axis1_scale: 'eti', axis1_rbac: 'granular' };
        const sec = deriveSecurity({ answers, variant: 'retail' });
        expect(sec.password_policy.minLength).toBe(14);
        expect(sec.password_policy.rotationDays).toBe(90);
        expect(sec.password_policy.historyDepth).toBe(12);
    });

    it('solo tpe → password basic 8 chars sans rotation', () => {
        const sec = deriveSecurity({ answers: { ...defaultAnswers(), axis1_scale: 'solo' }, variant: 'retail' });
        expect(sec.password_policy.minLength).toBe(8);
        expect(sec.password_policy.rotationDays).toBe(0);
    });

    it('eti + granular → SSO obligatoire, sinon facultatif', () => {
        expect(deriveSecurity({ answers: { ...defaultAnswers(), axis1_scale: 'eti', axis1_rbac: 'granular' }, variant: 'retail' }).sso_required).toBe(true);
        expect(deriveSecurity({ answers: { ...defaultAnswers(), axis1_scale: 'pme' }, variant: 'retail' }).sso_required).toBe(false);
    });

    it('IP whitelist activée pour santé + eti', () => {
        expect(deriveSecurity({ answers: defaultAnswers(), variant: 'clinic' }).ip_whitelist_enabled).toBe(true);
        expect(deriveSecurity({ answers: { ...defaultAnswers(), axis1_scale: 'eti' }, variant: 'retail' }).ip_whitelist_enabled).toBe(true);
        expect(deriveSecurity({ answers: defaultAnswers(), variant: 'retail' }).ip_whitelist_enabled).toBe(false);
    });

    it('journal login obligatoire pour santé/eti/AT', () => {
        expect(deriveSecurity({ answers: defaultAnswers(), variant: 'clinic' }).audit_login_journal).toBe(true);
        expect(deriveSecurity({ answers: { ...defaultAnswers(), axis3_safety: 'work_accidents' }, variant: 'garage' }).audit_login_journal).toBe(true);
    });

    it('mfa_required_roles reprend ce que RbacDeriver a fourni', () => {
        const sec = deriveSecurity({
            answers: defaultAnswers(), variant: 'retail',
            mfaRolesFromRbac: ['admin', 'manager'],
        });
        expect(sec.mfa_required_roles).toEqual(['admin', 'manager']);
    });

    it('audit trail derivedFrom peuplé pour chaque valeur', () => {
        const sec = deriveSecurity({ answers: defaultAnswers(), variant: 'restaurant' });
        expect(sec.derivedFrom['session_timeout_min']).toBeDefined();
        expect(sec.derivedFrom['password_policy']).toBeDefined();
        expect(sec.derivedFrom['ip_whitelist_enabled']).toBeDefined();
    });
});

// ── LegalDeriver ───────────────────────────────────────────────────────────────

describe('LegalDeriver', () => {
    it('resto FR → convention collective HCR IDCC 1979', () => {
        const legal = deriveLegal({ answers: defaultAnswers(), variant: 'restaurant', effectiveCapabilities: {} });
        expect(legal.collectiveAgreement.idcc).toBe('1979');
        expect(legal.collectiveAgreement.name).toContain('HCR');
    });

    it('B2C standard → CGV B2C requises', () => {
        const legal = deriveLegal({ answers: defaultAnswers(), variant: 'retail', effectiveCapabilities: {} });
        expect(legal.contractTypes.find(c => c.id === 'cgv')?.label).toBe('CGV B2C');
    });

    it('B2B quotes → CGV B2B', () => {
        const legal = deriveLegal({
            answers: { ...defaultAnswers(), axis2_commerceModel: 'b2b_quotes' },
            variant: 'retail', effectiveCapabilities: {},
        });
        expect(legal.contractTypes.find(c => c.id === 'cgv')?.label).toBe('CGV B2B');
    });

    it('mod_reservations ON → CGU réservation en ligne obligatoire', () => {
        const legal = deriveLegal({
            answers: defaultAnswers(), variant: 'salon',
            effectiveCapabilities: { mod_reservations: true },
        });
        expect(legal.contractTypes.find(c => c.id === 'cgu_booking')?.required).toBe(true);
    });

    it('mod_marketing ON → formulaire consentement obligatoire (Art. 7 RGPD)', () => {
        const legal = deriveLegal({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_marketing: true },
        });
        expect(legal.contractTypes.find(c => c.id === 'consent_marketing')?.required).toBe(true);
    });

    it('assurance clinic → RC médicale + cyber-santé', () => {
        const legal = deriveLegal({ answers: defaultAnswers(), variant: 'clinic', effectiveCapabilities: {} });
        expect(legal.professionalInsurance.type).toContain('médicale');
        expect(legal.professionalInsurance.coverage.some(c => /cyber/i.test(c))).toBe(true);
    });

    it('assurance garage → responsabilité véhicules confiés', () => {
        const legal = deriveLegal({ answers: defaultAnswers(), variant: 'garage', effectiveCapabilities: {} });
        expect(legal.professionalInsurance.coverage.some(c => /véhicules confiés/i.test(c))).toBe(true);
    });

    it('mentions légales spécifiques clinic → RPPS/ADELI + Ordre', () => {
        const legal = deriveLegal({ answers: defaultAnswers(), variant: 'clinic', effectiveCapabilities: {} });
        expect(legal.legalMentions.some(m => /RPPS|ADELI/.test(m))).toBe(true);
    });

    it('cookie policy requise si analytics ou marketing', () => {
        const legal = deriveLegal({
            answers: defaultAnswers(), variant: 'retail',
            effectiveCapabilities: { mod_marketing: true },
        });
        expect(legal.cookiePolicy.required).toBe(true);
        expect(legal.cookiePolicy.templateId).toBe('cookie_policy_fr_v2');
    });

    it('contrat CDI présent pour toute échelle > solo', () => {
        const legal = deriveLegal({
            answers: { ...defaultAnswers(), axis1_scale: 'tpe' },
            variant: 'retail', effectiveCapabilities: {},
        });
        expect(legal.contractTypes.find(c => c.id === 'employment_contract_cdi')).toBeDefined();
    });
});
