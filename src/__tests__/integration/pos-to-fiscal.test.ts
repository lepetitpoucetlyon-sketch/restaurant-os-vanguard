import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialNexusBridge } from '@/modules/finance';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { JournalEntry, FiscalSeal } from '@nexus/contracts';

describe('Integration: POS to Fiscal (DB-Agnostic Sovereign Adapter)', () => {
  const tenantId = 'tenant_test_1';

  beforeEach(async () => {
    // Nettoyer les collections via le Sovereign Adapter
    const entries = await Nexus.adapter.query<JournalEntry>(`tenants/${tenantId}/journalEntries`);
    for (const entry of entries) {
      if (entry.id) {
        await Nexus.adapter.delete(`tenants/${tenantId}/journalEntries/${entry.id}`).catch(() => {});
      }
    }
  });

  it('vente POS crée JournalEntry + FiscalSeal chaîné via Nexus.adapter universel', async () => {
    // 1. Déclencher le bridge financier universel
    const result = await FinancialNexusBridge.processOrder({
      cartItems: [{
        cartId: 'cart_1',
        categoryId: 'cat_beverages',
        modifiers: [],
        productId: 'p1',
        name: 'Café',
        quantity: 2,
        unitPriceInMicrounits: 2_000_000 as unknown as import('@/shared/schemas/primitives').Microunits,
        taxRate: '0.10',
        discountInMicrounits: 0 as unknown as import('@/shared/schemas/primitives').Microunits
      }],
      operatorId: 'op_1',
      tableId: 'table_3',
      tenantId,
      paymentMode: 'cash'
    });

    expect(result).toBeDefined();
    expect(result.seal).toBeDefined();
    expect(result.seal.id).toBeDefined();
    expect(result.journalEntry).toBeDefined();
    expect(result.journalEntry.amountInMicrounits).toBe(4_000_000); // 2 × 2€ = 4€

    // 2. Vérifier le sceau fiscal dans fiscalSeals
    const seal = await Nexus.adapter.get<FiscalSeal>(`tenants/${tenantId}/fiscalSeals/${result.seal.id}`);
    expect(seal).toBeDefined();
    expect(seal?.hash).toBeTruthy();
    expect(seal?.signature).toBeTruthy();
    expect(seal?.previousHash).toBeDefined();
  });
});
