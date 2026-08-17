import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FranchiseService } from '@/modules/commerce/franchise/services/FranchiseService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { DEFAULT_PAGE_ACCESS } from '@/modules/compliance/domain/schemas/rbac';
import type { FranchiseSiteOverview, InterSiteTransfer } from '@/shared/nexus/contracts/franchise.types';

describe('🏢 Franchise & Multi-Sites Domain Service Tests', () => {
    let mockAdapter: MockAdapter;

    beforeEach(() => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
    });

    describe('1. Récupération et Consolidation des Établissements Réseau', () => {
        it('devrait récupérer la liste des sites et calculer les métriques de base', async () => {
            const sites = await FranchiseService.getOwnerSites('admin@restaurantos.app');
            expect(sites.length).toBeGreaterThan(0);
            
            const siteA = sites[0];
            expect(siteA.tenantId).toBeDefined();
            expect(siteA.todayRevenueInCents).toBeGreaterThan(0);
            expect(siteA.coversServedCount).toBeGreaterThan(0);
            expect(siteA.averageTicketInCents).toBe(
                Math.round(siteA.todayRevenueInCents / siteA.coversServedCount)
            );
        });

        it('devrait consolider fidèlement les métriques de plusieurs restaurants', () => {
            const mockSites: FranchiseSiteOverview[] = [
                {
                    tenantId: 'site_paris',
                    name: 'Paris Marais',
                    status: 'ONLINE',
                    todayRevenueInCents: 450000,
                    openOrdersCount: 12,
                    coversServedCount: 90,
                    averageTicketInCents: 5000,
                    activeStaffCount: 6,
                    stockAlertsCount: 2,
                    healthScore: 98,
                    complianceScore: 100,
                    lastActivity: new Date().toISOString(),
                },
                {
                    tenantId: 'site_lyon',
                    name: 'Lyon Presqu’île',
                    status: 'ONLINE',
                    todayRevenueInCents: 300000,
                    openOrdersCount: 8,
                    coversServedCount: 60,
                    averageTicketInCents: 5000,
                    activeStaffCount: 4,
                    stockAlertsCount: 1,
                    healthScore: 95,
                    complianceScore: 100,
                    lastActivity: new Date().toISOString(),
                }
            ];

            const summary = FranchiseService.consolidateMetrics(mockSites);

            expect(summary.totalSites).toBe(2);
            expect(summary.onlineSites).toBe(2);
            expect(summary.totalTodayRevenueInCents).toBe(750000);
            expect(summary.totalOpenOrders).toBe(20);
            expect(summary.totalCoversServed).toBe(150);
            expect(summary.averageTicketInCents).toBe(5000);
            expect(summary.totalStockAlerts).toBe(3);
            expect(summary.topPerformingSite?.tenantId).toBe('site_paris');
            expect(summary.topPerformingSite?.revenueInCents).toBe(450000);
        });
    });

    describe('2. Gestion et Exécution Atomique des Transferts Inter-Sites (Invariant #2)', () => {
        it('devrait créer une demande de transfert avec statut REQUESTED et ID déterministe', async () => {
            const transfer = await FranchiseService.createStockTransfer({
                sourceTenantId: 'lepetitpoucet',
                sourceTenantName: 'Le Petit Poucet',
                targetTenantId: 'bistrolyon',
                targetTenantName: 'Bistro Lyon',
                requestedBy: 'admin_lepetitpoucet',
                items: [{ itemId: 'item_flour', itemName: 'Farine T55', quantity: 20, unit: 'kg' }],
                notes: 'Dépannage pour rush du soir'
            });

            expect(transfer.id).toMatch(/^XFER-\d+-[A-Z0-9]+$/);
            expect(transfer.status).toBe('REQUESTED');
            expect(transfer.items[0].quantity).toBe(20);
        });

        it('devrait exécuter le transfert avec décrémentation et incrémentation atomiques', async () => {
            const incrementSpy = vi.spyOn(mockAdapter, 'increment').mockResolvedValue();

            const initialTransfer: InterSiteTransfer = {
                id: 'XFER-TEST-001',
                groupId: 'group_lyon',
                sourceTenantId: 'lepetitpoucet',
                sourceTenantName: 'Le Petit Poucet',
                targetTenantId: 'bistrolyon',
                targetTenantName: 'Bistro Lyon',
                requestedBy: 'admin_lepetitpoucet',
                requestedAt: new Date().toISOString(),
                status: 'REQUESTED',
                items: [
                    { itemId: 'item_butter', itemName: 'Beurre AOP', quantity: 10, unit: 'kg' },
                    { itemId: 'item_sugar', itemName: 'Sucre Glace', quantity: 5, unit: 'kg' },
                ],
                updatedAt: new Date().toISOString()
            };

            const executed = await FranchiseService.executeStockTransfer(initialTransfer, 'manager_bistro');

            expect(executed.status).toBe('RECEIVED');
            expect(executed.receivedBy).toBe('manager_bistro');
            expect(executed.receivedAt).toBeDefined();

            // Vérification de l'Invariant #2 : 2 décréments (source) et 2 incréments (cible)
            expect(incrementSpy).toHaveBeenCalledTimes(4);
            expect(incrementSpy).toHaveBeenCalledWith('tenants/lepetitpoucet/stockItems/item_butter', 'currentStock', -10);
            expect(incrementSpy).toHaveBeenCalledWith('tenants/bistrolyon/stockItems/item_butter', 'currentStock', 10);
            expect(incrementSpy).toHaveBeenCalledWith('tenants/lepetitpoucet/stockItems/item_sugar', 'currentStock', -5);
            expect(incrementSpy).toHaveBeenCalledWith('tenants/bistrolyon/stockItems/item_sugar', 'currentStock', 5);
        });
    });

    describe('3. Rôles et Droits d’Accès (RBAC)', () => {
        it('devrait restreindre l’accès par défaut de la page franchise à admin et directeur', () => {
            const allowedRoles = DEFAULT_PAGE_ACCESS['franchise'];
            expect(allowedRoles).toContain('admin');
            expect(allowedRoles).toContain('directeur');
            expect(allowedRoles).not.toContain('serveur');
            expect(allowedRoles).not.toContain('plongeur');
        });
    });
});
