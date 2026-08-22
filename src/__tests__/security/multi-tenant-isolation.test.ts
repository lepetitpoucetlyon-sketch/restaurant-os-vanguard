import { describe, it, expect, beforeEach } from 'vitest';
import { ShieldedContext, SovereignSecurityViolation } from '@/modules/intelligence/ia/ai/ShieldedContext';
import { DNAInjector } from '@/modules/intelligence/ia/ai/DNAInjector';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { FiscalKeyService } from '@/modules/finance';
import { hashPin } from '@/lib/shared-kernel';

describe('🛡️ Multi-Tenant Isolation & DNA Injector Audit Suite', () => {
    beforeEach(() => {
        Nexus.adapter = new MockAdapter();
        Nexus.tenantOverride = 'tenant_alpha';
    });

    describe('1. ShieldedContext Sandbox & Execution Threads', () => {
        it('devrait exécuter du code dans le bac à sable du tenant actif', async () => {
            const result = await ShieldedContext.run('tenant_alpha', () => {
                return ShieldedContext.getActiveTenant();
            });
            expect(result).toBe('tenant_alpha');
        });

        it('devrait autoriser l’accès lorsque le tenant demandé correspond au contexte actif', async () => {
            await ShieldedContext.run('tenant_alpha', () => {
                expect(() => ShieldedContext.assertTenantAccess('tenant_alpha')).not.toThrow();
            });
        });

        it('devrait bloquer toute tentative d’accès cross-tenant (crossover leak) avec SovereignSecurityViolation', async () => {
            await ShieldedContext.run('tenant_alpha', () => {
                expect(() => ShieldedContext.assertTenantAccess('tenant_beta')).toThrow(SovereignSecurityViolation);
            });
        });

        it('devrait rétablir le contexte précédent après la sortie du sandbox', async () => {
            await ShieldedContext.run('tenant_inner', () => {
                expect(ShieldedContext.getActiveTenant()).toBe('tenant_inner');
            });
            expect(ShieldedContext.getActiveTenant()).toBeNull();
        });
    });

    describe('2. DNAInjector Protection & Privacy', () => {
        it('devrait bloquer l’injection d’ADN d’un tenant tiers dans le contexte d’un autre tenant', async () => {
            await ShieldedContext.run('tenant_attacker', async () => {
                await expect(DNAInjector.getTenantDNA('tenant_victim')).rejects.toThrow(SovereignSecurityViolation);
            });
        });

        it('devrait permettre l’injection d’ADN pour le tenant légitime', async () => {
            await ShieldedContext.run('lepetitpoucet', async () => {
                const dna = await DNAInjector.getTenantDNA('lepetitpoucet');
                expect(dna).toContain('LEPETITPOUCET');
            });
        });
    });

    describe('3. Isolation Cryptographique & Secrets par Tenant', () => {
        it('devrait générer des clés de signature NF525 uniques et indépendantes par tenant', () => {
            const key1 = FiscalKeyService.generateKey();
            const key2 = FiscalKeyService.generateKey();
            expect(key1).not.toBe(key2);
            expect(key1.length).toBeGreaterThanOrEqual(32);
            expect(key2.length).toBeGreaterThanOrEqual(32);
        });

        it('devrait produire des hashs de PIN distincts et salés par identifiant tenant', async () => {
            const pin = '1234';
            const hashA = await hashPin(pin, 'admin_tenant_alpha');
            const hashB = await hashPin(pin, 'admin_tenant_beta');
            expect(hashA).not.toBe(hashB);
        });
    });

    describe('4. SovereignGuard & Scoping de Données', () => {
        it('devrait extraire le bon nom de collection pour les chemins tenant', () => {
            expect(SovereignGuard.extractCollectionName('tenants/resto_1/orders/ord_123')).toBe('orders');
            expect(SovereignGuard.extractCollectionName('tenants/resto_1/stockItems')).toBe('stockItems');
        });

        it('devrait interdire la suppression sur les collections immuables NF525', () => {
            expect(SovereignGuard.canDelete('tenants/resto_1/fiscalLedger/entry_1')).toBe(false);
            expect(SovereignGuard.canDelete('tenants/resto_1/fiscalSeals/seal_1')).toBe(false);
            expect(SovereignGuard.canDelete('tenants/resto_1/auditTrails/log_1')).toBe(false);
            expect(SovereignGuard.canDelete('tenants/resto_1/menuItems/item_1')).toBe(true);
        });
    });
});
