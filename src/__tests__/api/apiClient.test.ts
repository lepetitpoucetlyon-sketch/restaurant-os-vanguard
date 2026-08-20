import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/api/client';

describe('ApiClient — Client Type-Safe End-to-End', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = new ApiClient({ baseUrl: 'http://localhost:3000' });
        vi.restoreAllMocks();
    });

    it('appelle l\'endpoint menu v1 avec les bons headers et paramètres', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                tenantId: 'test-resto',
                currency: 'EUR',
                categories: [],
                count: 0,
            }),
        } as Response);

        const res = await client.v1.menu.get('test-resto');
        expect(res.tenantId).toBe('test-resto');
        expect(fetchSpy).toHaveBeenCalledWith(
            'http://localhost:3000/api/v1/menu?tenantId=test-resto',
            expect.objectContaining({
                headers: expect.any(Headers),
            })
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
                {
                    productId: 'prod-burger',
                    name: 'Burger Gourmet',
                    quantity: 1,
                    unitPriceMu: 15_000_000,
                },
            ],
        });

        expect(res.success).toBe(true);
        expect(res.orderId).toBe('ord-123');
        expect(fetchSpy).toHaveBeenCalled();
    });
});
