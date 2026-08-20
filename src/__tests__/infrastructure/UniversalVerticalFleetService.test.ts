import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalVerticalFleetService } from '@/infrastructure/services/fleet/UniversalVerticalFleetService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { OpsAlertGateway } from '@/lib/adapters/OpsAlertGateway';

describe('UniversalVerticalFleetService — Couche Généraliste Multi-Verticales', () => {
    let mockAdapter: MockAdapter;

    beforeEach(() => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        vi.restoreAllMocks();
    });

    it('calcule la santé globale et regroupe par verticale (Restaurant, Boulangerie, Salon, Retail)', async () => {
        // Simuler une flotte hétérogène de 4 verticales
        await mockAdapter.set('tenants/resto-paris', {
            id: 'resto-paris',
            name: 'Le Bistro Parisien',
            variant: 'restaurant',
        });
        await mockAdapter.set('tenants/boulangerie-lyon', {
            id: 'boulangerie-lyon',
            name: 'Le Fournil de Lyon',
            variant: 'bakery',
        });
        await mockAdapter.set('tenants/salon-marseille', {
            id: 'salon-marseille',
            name: 'L\'Atelier Coiffure',
            variant: 'salon',
        });
        await mockAdapter.set('tenants/boutique-lille', {
            id: 'boutique-lille',
            name: 'Mode & Style Retail',
            variant: 'retail',
        });

        const health = await UniversalVerticalFleetService.getUniversalFleetHealth();

        expect(health.totalTenants).toBe(4);
        expect(health.averageHealth).toBeGreaterThanOrEqual(90);

        // Vérifier le breakdown par verticale
        expect(health.verticalBreakdown['restaurant']).toBeDefined();
        expect(health.verticalBreakdown['restaurant'].count).toBe(1);
        expect(health.verticalBreakdown['restaurant'].emoji).toBe('🍽️');

        expect(health.verticalBreakdown['bakery']).toBeDefined();
        expect(health.verticalBreakdown['bakery'].count).toBe(1);
        expect(health.verticalBreakdown['bakery'].emoji).toBe('🥐');

        expect(health.verticalBreakdown['salon']).toBeDefined();
        expect(health.verticalBreakdown['salon'].count).toBe(1);
        expect(health.verticalBreakdown['salon'].emoji).toBe('✂️');

        expect(health.verticalBreakdown['retail']).toBeDefined();
        expect(health.verticalBreakdown['retail'].count).toBe(1);
        expect(health.verticalBreakdown['retail'].emoji).toBe('🛍️');
    });

    it('sauvegarde l\'ensemble de la flotte multi-verticale et trace la répartition par verticale', async () => {
        await mockAdapter.set('tenants/resto-1', { id: 'resto-1', variant: 'restaurant' });
        await mockAdapter.set('tenants/bakery-1', { id: 'bakery-1', variant: 'bakery' });
        await mockAdapter.set('tenants/salon-1', { id: 'salon-1', variant: 'salon' });

        const result = await UniversalVerticalFleetService.executeFleetBackup({ providerKind: 'local' });

        expect(result.totalTenants).toBe(3);
        expect(result.succeeded).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.byVertical['restaurant'].succeeded).toBe(1);
        expect(result.byVertical['bakery'].succeeded).toBe(1);
        expect(result.byVertical['salon'].succeeded).toBe(1);
    });

    it('émet une alerte OpsAlertGateway avec le contexte de la verticale en cas d\'échec', async () => {
        await mockAdapter.set('tenants/faulty-gym', { id: 'faulty-gym', variant: 'custom' });

        const sendAlertSpy = vi.spyOn(OpsAlertGateway, 'send').mockResolvedValue(true);

        const { LocalFSBackupProvider } = await import('@/infrastructure/services/backup/BackupProvider');
        vi.spyOn(LocalFSBackupProvider.prototype, 'upload').mockRejectedValueOnce(new Error('Simulation panne disque'));

        const result = await UniversalVerticalFleetService.executeFleetBackup({ providerKind: 'local' });

        expect(result.failed).toBe(1);
        expect(sendAlertSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'critical',
                title: expect.stringContaining('CUSTOM'),
                context: expect.objectContaining({
                    tenantId: 'faulty-gym',
                    vertical: 'custom',
                }),
            })
        );
    });
});
