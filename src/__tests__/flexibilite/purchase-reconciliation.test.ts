import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseReconciliationService } from '@/modules/logistics/stock/services/PurchaseReconciliationService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Lot 3 — Rapprochement Asynchrone Achats ↔ Stock (M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('Rapprochement facture tardive (15j après) : calcule l écart de coût, réajuste le PUMP et archive la variance', async () => {
    const store: Record<string, unknown> = {
      // 1. Réception physique passée (Bon de livraison sans facture ou prix estimé)
      'tenants/bistro-mer/goodsReceipts/rec-poisson-01': {
        id: 'rec-poisson-01',
        tenantId: 'bistro-mer',
        supplierId: 'maree-bretonne',
        deliveryNoteNumber: 'BL-9874',
        status: 'received_provisional',
        receivedAt: '2026-08-15T06:00:00.000Z',
        lines: [
          {
            stockItemId: 'bar-frais',
            quantity: 10, // 10 kg
            provisionalUnitPriceCts: 1500, // Estimé à 15,00 €/kg
          },
        ],
      },
      // État courant du stockItem
      'tenants/bistro-mer/stockItems/bar-frais': {
        id: 'bar-frais',
        tenantId: 'bistro-mer',
        currentQuantity: 10,
        currentPumpCts: 1500,
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      return (store[path] as never) ?? null;
    });

    vi.spyOn(Nexus.adapter, 'set').mockImplementation(async (path: string, val: unknown) => {
      store[path] = val;
    });

    vi.spyOn(Nexus.adapter, 'update').mockImplementation(async (path: string, val: unknown) => {
      store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
    });

    vi.spyOn(Nexus.adapter, 'runTransaction').mockImplementation(async (callback) => {
      const tx = {
        get: async (path: string) => (store[path] as unknown) ?? null,
        set: async (path: string, val: unknown) => { store[path] = val; },
        update: async (path: string, val: unknown) => {
          store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
        },
        delete: async (path: string) => { delete store[path]; },
      };
      return callback(tx as never);
    });

    let detectedVarianceEvent: unknown = null;
    NexusEventBus.on('finance.purchase_variance_detected', async (payload) => {
      detectedVarianceEvent = payload;
    });

    // 2. Quinze jours plus tard, la facture arrive à 18,00 €/kg (1 800 cts) au lieu de 15,00 €/kg
    const result = await PurchaseReconciliationService.reconcileInvoiceWithReceipt({
      tenantId: 'bistro-mer',
      supplierId: 'maree-bretonne',
      invoiceId: 'fact-maree-2026-08',
      receiptId: 'rec-poisson-01',
      invoiceLines: [
        {
          stockItemId: 'bar-frais',
          actualUnitPriceCts: 1800,
        },
      ],
      approvedBy: 'comptable-1',
    });

    // 3. Vérifications :
    // Différence = +300 cts/kg × 10 kg = +3 000 cts (+30,00 €)
    expect(result.totalVarianceCts).toBe(3000);
    expect(result.variances).toHaveLength(1);
    expect(result.variances[0].varianceAmountCts).toBe(3000);

    // Une écriture d'écart a été enregistrée
    const varianceDoc = store['tenants/bistro-mer/inventory_variances/var_rec-poisson-01_fact-maree-2026-08_bar-frais'] as {
      varianceAmountCts: number;
      actualPriceCts: number;
    };
    expect(varianceDoc).toBeDefined();
    expect(varianceDoc.varianceAmountCts).toBe(3000);
    expect(varianceDoc.actualPriceCts).toBe(1800);

    // Le PUMP du stockItem a été ajusté : 1500 + (3000 / 10) = 1800 cts
    const updatedStock = store['tenants/bistro-mer/stockItems/bar-frais'] as { currentPumpCts: number };
    expect(updatedStock.currentPumpCts).toBe(1800);

    // La réception est marquée 'reconciled'
    const updatedReceipt = store['tenants/bistro-mer/goodsReceipts/rec-poisson-01'] as { status: string; invoiceId: string };
    expect(updatedReceipt.status).toBe('reconciled');
    expect(updatedReceipt.invoiceId).toBe('fact-maree-2026-08');

    // L'événement a été émis
    expect(detectedVarianceEvent).toBeDefined();
    expect((detectedVarianceEvent as { varianceAmountCts: number }).varianceAmountCts).toBe(3000);
  });
});
