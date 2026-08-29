import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handlePromotions } from '@/app/api/promotions/route';
import { GET as getMccContracts, POST as postMccContracts } from '@/app/api/mcc/contracts/route';
import { GET as getDiagnostics, POST as postDiagnostics } from '@/app/api/facility/hardware/diagnostics/route';
import { POST as handleTheForkWebhook } from '@/app/api/webhooks/thefork/route';

describe('🛡️ Lot 1 — Protection des 4 Routes API Ouvertes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.THEFORK_WEBHOOK_SECRET;
    });

    describe('1. /api/promotions', () => {
        it('rejette les requêtes anonymes non authentifiées', async () => {
            const req = new NextRequest('http://localhost:3000/api/promotions', {
                method: 'POST',
                body: JSON.stringify({ promoId: 'p1', discountPercent: 10 }),
            });
            const res = await handlePromotions(req);
            expect(res.status).toBe(404); // hiddenDoor returns 404 for unauthenticated callers
        });
    });

    describe('2. /api/mcc/contracts', () => {
        it('GET rejette les requêtes sans jeton MCC', async () => {
            const req = new NextRequest('http://localhost:3000/api/mcc/contracts', { method: 'GET' });
            const res = await getMccContracts(req);
            expect(res.status).toBe(404);
        });

        it('POST rejette les requêtes sans jeton MCC super admin', async () => {
            const req = new NextRequest('http://localhost:3000/api/mcc/contracts', {
                method: 'POST',
                body: JSON.stringify({ tenantId: 't1', vertical: 'restaurant', client: 'test', pricing: 100 }),
            });
            const res = await postMccContracts(req);
            expect(res.status).toBe(404);
        });
    });

    describe('3. /api/facility/hardware/diagnostics', () => {
        it('GET rejette les requêtes anonymes', async () => {
            const req = new NextRequest('http://localhost:3000/api/facility/hardware/diagnostics?tenantId=t1', { method: 'GET' });
            const res = await getDiagnostics(req);
            expect(res.status).toBe(404);
        });

        it('POST rejette les requêtes anonymes', async () => {
            const req = new NextRequest('http://localhost:3000/api/facility/hardware/diagnostics', {
                method: 'POST',
                body: JSON.stringify({ tenantId: 't1' }),
            });
            const res = await postDiagnostics(req);
            expect(res.status).toBe(404);
        });
    });

    describe('4. /api/webhooks/thefork', () => {
        it('rejette en 401 si le secret webhook n\'est pas configuré sur le serveur (fail-closed)', async () => {
            const req = new NextRequest('http://localhost:3000/api/webhooks/thefork', {
                method: 'POST',
                headers: { 'x-thefork-key': 'random-key' },
                body: JSON.stringify({ tenantId: 't1', booking: { id: 'b123' } }),
            });
            const res = await handleTheForkWebhook(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toContain('invalide ou service non configuré');
        });

        it('rejette en 401 si la clé fournie ne correspond pas au secret configuré', async () => {
            process.env.THEFORK_WEBHOOK_SECRET = 'super-secret-thefork-key';
            const req = new NextRequest('http://localhost:3000/api/webhooks/thefork', {
                method: 'POST',
                headers: { 'x-thefork-key': 'wrong-key' },
                body: JSON.stringify({ tenantId: 't1', booking: { id: 'b123' } }),
            });
            const res = await handleTheForkWebhook(req);
            expect(res.status).toBe(401);
        });
    });
});
