import { describe, it, expect } from 'vitest';
import { AIScopeGuard } from '@/kernel/ai/core/AIScopeGuard';

describe('AIScopeGuard', () => {
    // ── MCC Scope ──────────────────────────────────────────────

    describe('assertMCCScope', () => {
        it('autorise un caller fleet admin', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/app/api/admin/fleet/support-ai/diagnose/route.ts'),
            ).not.toThrow();
        });

        it('autorise un caller MCC admin', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/app/api/admin/mcc/config/route.ts'),
            ).not.toThrow();
        });

        it('autorise un handler SupportTicket', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts'),
            ).not.toThrow();
        });

        it('autorise le kernel/ai/mcc lui-même', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/kernel/ai/mcc/MCCAIRegistry.ts'),
            ).not.toThrow();
        });

        it('BLOQUE un module tenant (modules/ops)', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/modules/ops/pos/route.ts'),
            ).toThrow(/VIOLATION R1/);
        });

        it('BLOQUE un module tenant (modules/intelligence)', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/modules/intelligence/services/MacroBrain.ts'),
            ).toThrow(/VIOLATION R1/);
        });

        it('BLOQUE un caller app/api non-admin', () => {
            expect(() =>
                AIScopeGuard.assertMCCScope('src/app/api/oracle/route.ts'),
            ).toThrow(/VIOLATION R1/);
        });
    });

    // ── Tenant Scope ──────────────────────────────────────────

    describe('assertTenantScope', () => {
        it('autorise un module intelligence', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/modules/intelligence/services/MacroBrain.ts'),
            ).not.toThrow();
        });

        it('autorise un parser OCR', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/modules/commerce/acquisition/onboarding/migration/parsers/imageParser.ts'),
            ).not.toThrow();
        });

        it('autorise app/api/tenant', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/app/api/tenant/onboarding/ocr/route.ts'),
            ).not.toThrow();
        });

        it('BLOQUE un caller fleet admin', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/app/api/admin/fleet/support-ai/diagnose/route.ts'),
            ).toThrow(/VIOLATION R1/);
        });

        it('BLOQUE un caller MCC admin', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/app/api/admin/mcc/config/route.ts'),
            ).toThrow(/VIOLATION R1/);
        });

        it('BLOQUE kernel/ai/mcc', () => {
            expect(() =>
                AIScopeGuard.assertTenantScope('src/kernel/ai/mcc/MCCAIRegistry.ts'),
            ).toThrow(/VIOLATION R1/);
        });
    });

    // ── Detect Scope ──────────────────────────────────────────

    describe('detectScope', () => {
        it('détecte scope MCC pour fleet admin', () => {
            expect(AIScopeGuard.detectScope('src/app/api/admin/fleet/diagnose/route.ts')).toBe('mcc');
        });

        it('détecte scope tenant pour modules/', () => {
            expect(AIScopeGuard.detectScope('src/modules/intelligence/services/MacroBrain.ts')).toBe('tenant');
        });

        it('détecte scope tenant pour app/api/tenant', () => {
            expect(AIScopeGuard.detectScope('src/app/api/tenant/ocr/route.ts')).toBe('tenant');
        });

        it('retourne unknown pour un chemin inconnu', () => {
            expect(AIScopeGuard.detectScope('src/lib/utils.ts')).toBe('unknown');
        });
    });
});
