import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerResaAllergenCheckHandler } from '@/shared/eventBus/handlers/ResaAllergenCheckHandler';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

function captureHandler(): (...args: unknown[]) => Promise<void> {
  const calls = vi.mocked(NexusEventBus.on).mock.calls;
  if (calls.length === 0) throw new Error('captureHandler: NexusEventBus.on jamais appelé');
  const last = calls[calls.length - 1];
  return last[1] as (...args: unknown[]) => Promise<void>;
}

describe('ResaAllergenCheckHandler — Accueil Client & Transmission Allergènes KDS', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(NexusEventBus, 'on');
        vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined as never);
        vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as never);
        vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined);
        vi.spyOn(empireAudit, 'log').mockImplementation(() => {});
    });

    it('devrait persister le badge d allergènes et émettre notification.urgent quand des allergènes sont déclarés', async () => {
        registerResaAllergenCheckHandler();
        const handler = captureHandler();

        await handler({
            v: 1,
            tenantId: 'tenant_paris',
            reservationId: 'resa_123',
            customerId: 'cust_456',
            tableId: 'table_12',
            allergens: ['Arachides', 'Gluten'],
            covers: 4,
            matchedAt: 1700000000000,
        });

        // 1. Vérification de la persistance du badge sur la table pour le KDS
        expect(Nexus.adapter.set).toHaveBeenCalledWith(
            'tenants/tenant_paris/tableAllergenBadges/table_12',
            expect.objectContaining({
                tableId: 'table_12',
                reservationId: 'resa_123',
                customerId: 'cust_456',
                allergens: ['Arachides', 'Gluten'],
                covers: 4,
            })
        );

        // 2. Vérification de la notification urgente vers la cuisine
        expect(NexusEventBus.emit).toHaveBeenCalledWith(
            'notification.urgent',
            expect.objectContaining({
                tenantId: 'tenant_paris',
                priority: 'CRITICAL',
                message: expect.stringContaining('Arachides, Gluten'),
                roles: expect.arrayContaining(['chef_cuisinier', 'cuisinier']),
            })
        );

        // 3. Vérification du drapeau CRM
        expect(NexusEventBus.emit).toHaveBeenCalledWith(
            'crm.allergen_flagged',
            expect.objectContaining({
                customerId: 'cust_456',
                allergens: ['Arachides', 'Gluten'],
            })
        );

        // 4. Vérification de l'audit de conformité alimentaire
        expect(empireAudit.log).toHaveBeenCalledWith(
            expect.objectContaining({
                module: 'compliance',
                action: 'ALLERGEN_TRANSMITTED_TO_KDS',
                severity: 'high',
            })
        );
    });

    it('devrait ignorer la notification urgente si aucun allergène n est déclaré', async () => {
        registerResaAllergenCheckHandler();
        const handler = captureHandler();

        await handler({
            v: 1,
            tenantId: 'tenant_paris',
            reservationId: 'resa_789',
            tableId: 'table_05',
            allergens: [],
            covers: 2,
            matchedAt: 1700000000000,
        });

        expect(Nexus.adapter.set).not.toHaveBeenCalled();
        expect(NexusEventBus.emit).not.toHaveBeenCalledWith('notification.urgent', expect.anything());
    });
});
