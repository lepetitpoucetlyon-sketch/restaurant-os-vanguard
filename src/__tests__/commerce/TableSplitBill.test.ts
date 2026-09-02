import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { POST as splitBillHandler } from '@/app/api/v1/orders/[id]/split-bill/route';

/**
 * Partage d'addition — la modale convive (`TableSplitBillModal`) n'encaisse rien :
 * elle appelle `POST /api/v1/orders/[id]/split-bill` qui persiste le partage et
 * émet `pos.split_bill_processed`. Le règlement se fait au POS.
 */

describe("TableSplitBill — division égale, reliquat indivisible (Invariant #5, microunits)", () => {
  function computeEqualSplit(totalInMicrounits: number, count: number): number[] {
    const safe = Math.max(1, count);
    const base = Math.floor(totalInMicrounits / safe);
    const remainder = totalInMicrounits % safe;
    return Array.from({ length: safe }, (_, idx) => (idx === safe - 1 ? base + remainder : base));
  }

  it('alloue le reliquat sur la dernière part — 100 € en 3', () => {
    const total = 100_000_000; // 100,00 €
    const parts = computeEqualSplit(total, 3);
    expect(parts).toEqual([33_333_333, 33_333_333, 33_333_334]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
  });

  it('division en 7 sans perte de micro-unité — 153,79 €', () => {
    const total = 153_790_000;
    const parts = computeEqualSplit(total, 7);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
  });

  it('pourboire optionnel calculé en micro-unités', () => {
    const base = 40_000_000; // 40 €
    const tip = Math.round((base * 15) / 100);
    expect(tip).toBe(6_000_000);
    expect(base + tip).toBe(46_000_000);
  });
});

describe('POST /api/v1/orders/[id]/split-bill', () => {
  const tenantId = 'bistro-split-test';
  const orderId = 'ord_api_split_001';

  beforeEach(() => {
    vi.clearAllMocks();
    Nexus.tenantOverride = tenantId;
  });

  it('persiste le partage et émet pos.split_bill_processed', async () => {
    const spy = vi.fn();
    const off = NexusEventBus.on('pos.split_bill_processed', spy, { id: 'test-split-processed' });

    const req = new NextRequest(
      `http://localhost:3000/api/v1/orders/${orderId}/split-bill?tenantId=${tenantId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          splitType: 'equipartition',
          partsCount: 3,
          shareInMicrounits: 12_000_000,
          tipInMicrounits: 1_000_000,
          totalInMicrounits: 36_000_000,
          method: 'card',
        }),
      },
    );

    const res = await splitBillHandler(req, { params: Promise.resolve({ id: orderId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.dueInMicrounits).toBe(13_000_000);

    const stored = await Nexus.adapter.get<{ splitType: string; partsCount: number; status: string }>(
      `tenants/${tenantId}/billSplits/${orderId}`,
    );
    expect(stored?.splitType).toBe('equipartition');
    expect(stored?.partsCount).toBe(3);
    expect(stored?.status).toBe('pending_settlement');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId, orderId, partsCount: 3, totalInMicrounits: 36_000_000 }),
    );

    off();
  });

  it('rejette un payload invalide (400)', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/v1/orders/${orderId}/split-bill?tenantId=${tenantId}`,
      { method: 'POST', body: JSON.stringify({ splitType: 'nope', partsCount: 0 }) },
    );
    const res = await splitBillHandler(req, { params: Promise.resolve({ id: orderId }) });
    expect(res.status).toBe(400);
  });
});
