import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenApiSpecService } from '@/lib/api/OpenApiSpecService';
import { POST as createOrderHandler } from '@/app/api/v1/orders/route';
import { GET as getMenuHandler } from '@/app/api/v1/menu/route';
import { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

vi.mock('@/lib/server/adminAuthGuard', () => ({
  requireTenantUser: vi.fn().mockResolvedValue({ tenantId: 'bistro-api-test', uid: 'op-test-01', role: 'manager' }),
  isDenied: vi.fn().mockReturnValue(false),
}));

describe('Socle API REST v1 OpenAPI & Orders / Menu (H2.2)', () => {
  const tenantId = 'bistro-api-test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait générer une spécification OpenAPI 3.0 valide et complète', () => {
    const spec = OpenApiSpecService.getSpec();

    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toContain('Restaurant OS');
    expect(spec.paths['/menu']).toBeDefined();
    expect(spec.paths['/orders']).toBeDefined();
  });

  it('devrait créer une commande via POST /api/v1/orders et émettre order.placed', async () => {
    const orderPlacedSpy = vi.fn();
    NexusEventBus.on('order.placed', orderPlacedSpy, { id: 'test-api-order-placed' });

    const orderPayload = {
      tenantId,
      tableId: 'tbl-mobile-01',
      channel: 'MOBILE_SERVER',
      items: [
        {
          productId: 'prod-burger',
          name: 'Burger Empire',
          quantity: 2,
          unitPriceInMicrounits: 18000000,
          course: 'plat',
        },
      ],
    };

    const req = new NextRequest('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    const res = await createOrderHandler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.orderId).toBeDefined();
    expect(json.totalInMicrounits).toBe(36000000);
    expect(orderPlacedSpy).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner le menu via GET /api/v1/menu', async () => {
    await Nexus.adapter.set(`tenants/${tenantId}/products`, {
      p1: { id: 'p1', name: 'Salade César', category: 'Entrées', priceInMicrounits: 12000000 },
      p2: { id: 'p2', name: 'Filet de Bœuf', category: 'Plats', priceInMicrounits: 28000000 },
    });

    const req = new NextRequest(`http://localhost:3000/api/v1/menu?tenantId=${tenantId}`);
    const res = await getMenuHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.categories).toContain('Entrées');
    expect(json.categories).toContain('Plats');
  });

  it('devrait rejeter GET /api/v1/menu sans tenantId avec un statut 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/menu');
    const res = await getMenuHandler(req);
    expect(res.status).toBe(400);
  });
});
