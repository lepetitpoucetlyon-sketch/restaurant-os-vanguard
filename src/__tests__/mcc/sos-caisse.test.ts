import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as submitTenantTicket } from '@/app/api/tenant/support/tickets/route';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import * as adminAuthGuard from '@/lib/server/adminAuthGuard';
import { NextRequest } from 'next/server';

describe('SOS Caisse & Diagnostic Urgence (Set 2 Ping-Pong)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(adminAuthGuard, 'requireTenantUser').mockResolvedValue({
            uid: 'user-server-01',
            tenantId: 'bistro-parisien',
            role: 'serveur',
        } as never);
        vi.spyOn(adminAuthGuard, 'isDenied').mockReturnValue(false);
    });

    it('devrait soumettre une alerte SOS Caisse, enregistrer le ticket et émettre support.ticket_submitted', async () => {
        const storedTickets: Record<string, unknown> = {};

        vi.spyOn(Nexus.adapter, 'set').mockImplementation(async (path: string, val: unknown) => {
            storedTickets[path] = val;
            return undefined;
        });

        vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
            return (storedTickets[path] as unknown) ?? null;
        });

        const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue([] as never);

        const req = new NextRequest('http://localhost:3000/api/tenant/support/tickets', {
            method: 'POST',
            body: JSON.stringify({
                description: '[SOS CAISSE EN SERVICE] Imprimante Cuisine : papier bloqué en plein rush (Table 14)',
            }),
        });

        const res = await submitTenantTicket(req);
        expect(res.status).toBe(201);

        const data = await res.json() as { ticketId: string; status: string };
        expect(data.ticketId).toBeDefined();

        // 1. Vérifier la persistance dans le store MCC
        expect(Nexus.adapter.set).toHaveBeenCalledWith(
            expect.stringContaining('mcc/supportTickets/'),
            expect.objectContaining({
                tenantId: 'bistro-parisien',
                source: 'tenant_submission',
                description: expect.stringContaining('SOS CAISSE EN SERVICE'),
                status: 'new',
            })
        );

        // 2. Vérifier l'émission de l'événement bus
        expect(emitSpy).toHaveBeenCalledWith(
            'support.ticket_submitted',
            expect.objectContaining({
                tenantId: 'bistro-parisien',
                description: expect.stringContaining('SOS CAISSE EN SERVICE'),
            })
        );
    });

    it('devrait rejeter une description trop courte (< 10 caractères)', async () => {
        const req = new NextRequest('http://localhost:3000/api/tenant/support/tickets', {
            method: 'POST',
            body: JSON.stringify({
                description: 'bug',
            }),
        });

        const res = await submitTenantTicket(req);
        expect(res.status).toBe(400);
    });
});
