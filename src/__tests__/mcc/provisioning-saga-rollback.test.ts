import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantProvisioningService } from '@/lib/mcc/provisioning/TenantProvisioningService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import * as provisioningSteps from '@/lib/mcc/provisioning/steps/provisioningSteps';
import { VerticalRegistry } from '@/shared/plugins/VerticalRegistry';

describe('TenantProvisioningService — Saga Rollback & Compensation', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devrait exécuter les compensations en cas d échec à une étape ultérieure', async () => {
        const setSpy = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);
        vi.spyOn(VerticalRegistry, 'resolve').mockReturnValue({
            id: 'mock_restaurant',
            version: '1.0.0',
            initialize: vi.fn().mockResolvedValue(undefined),
        } as never);
        
        // Mocking setupStripeCustomer to succeed
        vi.spyOn(provisioningSteps, 'setupStripeCustomer').mockResolvedValue('cus_test_123');
        vi.spyOn(provisioningSteps, 'setupFleetTelemetry').mockResolvedValue(undefined);
        vi.spyOn(provisioningSteps, 'setupRAGWorkspace').mockResolvedValue(undefined);
        
        // Mocking setupOwnerAccount to FAIL
        vi.spyOn(provisioningSteps, 'setupOwnerAccount').mockRejectedValue(new Error('Firebase Auth unavailable'));

        const request = {
            ownerEmail: 'test@bistro.fr',
            ownerName: 'Jean Dupont',
            companyName: 'Le Bistro Test',
            siret: '99988877700011',
            planId: 'STANDARD' as const,
            branding: { primaryColor: '#FF0000' },
        };

        await expect(
            TenantProvisioningService.provisionNewClient(request)
        ).rejects.toThrow('Firebase Auth unavailable');

        // Vérification qu'une compensation a marqué le tenantConfig comme échoué/verrouillé
        expect(setSpy).toHaveBeenCalledWith(
            expect.stringContaining('tenants/tenant_99988877700011/tenantConfig'),
            expect.objectContaining({
                status: expect.objectContaining({ killSwitch: true, reason: 'PROVISIONING_FAILED_ROLLED_BACK' })
            }),
            expect.any(Object)
        );

        await new Promise(r => setTimeout(r, 50));
    });
});
