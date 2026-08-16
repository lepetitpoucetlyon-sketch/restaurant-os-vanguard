import { describe, it, expect } from 'vitest';
import { 
  PurchaseInvoiceSplittingService, 
  type PurchaseInvoiceLineInput 
} from './PurchaseInvoiceSplittingService';

describe('PurchaseInvoiceSplittingService', () => {
  it('splits a complex wholesale invoice (Metro) into balanced PCG ledger entries', () => {
    const lines: PurchaseInvoiceLineInput[] = [
      {
        lineId: '1',
        description: 'Viande Bœuf Charolais 10kg',
        category: 'food',
        amountHtCts: 18000, // 180.00 € HT @ 5.5%
        vatRatePct: 5.5,
      },
      {
        lineId: '2',
        description: 'Carton Vin Bordeaux Rouge (6 bout)',
        category: 'alcohol',
        amountHtCts: 6000, // 60.00 € HT @ 20%
        vatRatePct: 20.0,
      },
      {
        lineId: '3',
        description: 'Bidon Détergent Dégraissant Sol 5L',
        category: 'cleaning',
        amountHtCts: 2500, // 25.00 € HT @ 20%
        vatRatePct: 20.0,
      },
      {
        lineId: '4',
        description: 'Boîtes Burgers Kraft x500',
        category: 'packaging',
        amountHtCts: 4500, // 45.00 € HT @ 20%
        vatRatePct: 20.0,
      },
    ];

    const result = PurchaseInvoiceSplittingService.splitInvoice('INV-METRO-8821', 'METRO_LYON', lines);

    // Total HT = 18000 + 6000 + 2500 + 4500 = 31000 cts (310.00 €)
    expect(result.totalHtCts).toBe(31000);

    // TVA 5.5% sur 18000 = 990 cts (9.90 €)
    // TVA 20% sur (6000 + 2500 + 4500 = 13000) = 2600 cts (26.00 €)
    // Total TVA = 990 + 2600 = 3590 cts (35.90 €)
    expect(result.totalVatCts).toBe(3590);

    // Total TTC = 31000 + 3590 = 34590 cts (345.90 €)
    expect(result.totalTtcCts).toBe(34590);

    expect(result.isBalanced).toBe(true);

    // Vérification des comptes PCG générés
    const foodEntry = result.entries.find((e) => e.accountNumber === '601000');
    const alcoholEntry = result.entries.find((e) => e.accountNumber === '607000');
    const cleaningEntry = result.entries.find((e) => e.accountNumber === '606300');
    const packagingEntry = result.entries.find((e) => e.accountNumber === '606800');
    const vatEntry = result.entries.find((e) => e.accountNumber === '445660');
    const supplierEntry = result.entries.find((e) => e.accountNumber === '401000');

    expect(foodEntry?.debitCts).toBe(18000);
    expect(alcoholEntry?.debitCts).toBe(6000);
    expect(cleaningEntry?.debitCts).toBe(2500);
    expect(packagingEntry?.debitCts).toBe(4500);
    expect(vatEntry?.debitCts).toBe(3590);
    expect(supplierEntry?.creditCts).toBe(34590);
  });
});
