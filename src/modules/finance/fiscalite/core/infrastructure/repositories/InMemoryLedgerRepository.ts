import type { VatLine } from '../../domain/entities/VatDeclaration';

export interface LedgerEntry {
  type: 'SALE' | 'PURCHASE';
  date: Date;
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
}

export class InMemoryLedgerRepository {
  private entries: LedgerEntry[] = [];

  // Mocks adding entries to the ledger
  public addEntry(entry: LedgerEntry) {
    this.entries.push(entry);
  }

  /**
   * Retrieves all VAT collected (from SALES) in a specific month and year
   * Aggregates by VAT rate.
   */
  public async getCollectedVat(tenantId: string, month: number, year: number): Promise<VatLine[]> {
    const sales = this.entries.filter(e => 
      e.type === 'SALE' && 
      e.date.getMonth() + 1 === month && 
      e.date.getFullYear() === year
    );

    const aggregated = sales.reduce((acc, sale) => {
      if (!acc[sale.vatRate]) {
        acc[sale.vatRate] = { rate: sale.vatRate, baseAmount: 0, vatAmount: 0 };
      }
      acc[sale.vatRate].baseAmount += sale.baseAmount;
      acc[sale.vatRate].vatAmount += sale.vatAmount;
      return acc;
    }, {} as Record<number, VatLine>);

    return Object.values(aggregated);
  }

  /**
   * Retrieves total deductible VAT (from PURCHASES) in a specific month and year
   */
  public async getDeductibleVat(tenantId: string, month: number, year: number): Promise<number> {
    const purchases = this.entries.filter(e => 
      e.type === 'PURCHASE' && 
      e.date.getMonth() + 1 === month && 
      e.date.getFullYear() === year
    );

    return purchases.reduce((sum, purchase) => sum + purchase.vatAmount, 0);
  }
}
