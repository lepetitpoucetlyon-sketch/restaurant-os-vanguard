import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/api/client';

describe('ApiClient — Client Type-Safe End-to-End', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = new ApiClient({ baseUrl: 'http://localhost:3000' });
        vi.restoreAllMocks();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 📡 API V1
    // ══════════════════════════════════════════════════════════════════════════

    describe('API v1', () => {
        it("appelle /api/v1/menu avec les bons headers et paramètres", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({ tenantId: 'test-resto', currency: 'EUR', categories: [], count: 0 }),
            } as Response);

            const res = await client.v1.menu.get('test-resto');
            expect(res.tenantId).toBe('test-resto');
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/menu?tenantId=test-resto',
                expect.objectContaining({ headers: expect.any(Headers) }),
            );
        });

        it('encode le tenantId dans /api/v1/tables', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({ tenantId: 'resto-café', totalTables: 5, occupiedCount: 2, tables: [] }),
            } as Response);

            await client.v1.tables.get('resto-café');
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/tables?tenantId=resto-caf%C3%A9',
                expect.anything(),
            );
        });

        it('valide le payload de commande avec Zod avant envoi', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    orderId: 'ord-123',
                    totalMu: 15_000_000,
                    status: 'PLACED',
                    estimatedMinutes: 20,
                }),
            } as Response);

            const res = await client.v1.orders.create('test-resto', {
                channel: 'DINE_IN',
                tableNumber: '4',
                items: [
                    { productId: 'prod-burger', name: 'Burger Gourmet', quantity: 1, unitPriceMu: 15_000_000 },
                ],
            });

            expect(res.success).toBe(true);
            expect(res.orderId).toBe('ord-123');
            expect(fetchSpy).toHaveBeenCalled();
            const call = fetchSpy.mock.calls[0];
            expect(call[1]?.method).toBe('POST');
        });

        it('REJETTE un payload orders invalide AVANT tout appel fetch', () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch');
            // Zod parse est synchrone → throw synchrone (pas rejection)
            expect(() =>
                client.v1.orders.create('test-resto', {
                    // channel manquant + items vide → Zod échoue
                    items: [],
                } as unknown as Parameters<typeof client.v1.orders.create>[1]),
            ).toThrow();
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it('encode orderId ET tenantId dans /api/v1/orders/:id', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'ord/with/slash',
                    tenantId: 'resto 1',
                    status: 'PAID',
                    totalMu: 0,
                    itemsCount: 0,
                }),
            } as Response);

            await client.v1.orders.get('resto 1', 'ord/with/slash');
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/v1/orders/ord%2Fwith%2Fslash?tenantId=resto%201',
                expect.anything(),
            );
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // ⏰ CRON & FLEET
    // ══════════════════════════════════════════════════════════════════════════

    describe('Cron & Fleet endpoints', () => {
        it("cron.dailyBackup avec secret encode la query string", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({ totalTenants: 5, succeeded: 5, failed: 0 }),
            } as Response);
            await client.cron.dailyBackup('super secret');
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/cron/daily-backup?secret=super%20secret',
                expect.anything(),
            );
        });

        it("cron.dailyBackup sans secret n'ajoute pas de query", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({ totalTenants: 0, succeeded: 0, failed: 0 }),
            } as Response);
            await client.cron.dailyBackup();
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/cron/daily-backup',
                expect.anything(),
            );
        });

        it("fleet.healthScore ciblé sur un tenantId encode la query", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);
            await client.fleet.healthScore('t1');
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/admin/fleet/health-score?tenantId=t1',
                expect.anything(),
            );
        });

        it("fleet.healthScore sans tenantId n'ajoute pas de query", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);
            await client.fleet.healthScore();
            expect(fetchSpy).toHaveBeenCalledWith(
                'http://localhost:3000/api/admin/fleet/health-score',
                expect.anything(),
            );
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // 🔒 Auth & erreurs
    // ══════════════════════════════════════════════════════════════════════════

    describe('Auth & gestion erreurs', () => {
        it('ajoute Authorization: Bearer si getAuthToken retourne un token', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);
            const authedClient = new ApiClient({
                baseUrl: 'http://localhost:3000',
                getAuthToken: () => 'test-token-abc',
            });
            await authedClient.cron.dailyBackup();
            const headers = fetchSpy.mock.calls[0][1]?.headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer test-token-abc');
        });

        it('supporte getAuthToken async', async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);
            const authedClient = new ApiClient({
                baseUrl: 'http://localhost:3000',
                getAuthToken: async () => 'async-token',
            });
            await authedClient.cron.dailyBackup();
            const headers = fetchSpy.mock.calls[0][1]?.headers as Headers;
            expect(headers.get('Authorization')).toBe('Bearer async-token');
        });

        it("n'ajoute PAS Authorization si getAuthToken retourne null", async () => {
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            } as Response);
            const authedClient = new ApiClient({
                baseUrl: 'http://localhost:3000',
                getAuthToken: () => null,
            });
            await authedClient.cron.dailyBackup();
            const headers = fetchSpy.mock.calls[0][1]?.headers as Headers;
            expect(headers.get('Authorization')).toBeNull();
        });

        it('throw un message clair si la réponse est ok=false', async () => {
            vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => 'Unauthorized',
            } as Response);
            await expect(client.cron.dailyBackup()).rejects.toThrow(/401.*Unauthorized/);
        });

        it('throw en cas d’erreur réseau (fetch reject)', async () => {
            vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('econnrefused'));
            await expect(client.cron.dailyBackup()).rejects.toThrow(/econnrefused/);
        });
    });
});
