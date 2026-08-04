export interface VatLine {
  rate: number; // e.g. 20.0, 10.0, 5.5
  baseAmount: number; // Base HT (Hors Taxes)
  vatAmount: number; // Montant de la TVA
}

export class VatDeclaration {
  public id: string;
  public tenantId: string;
  public month: number;
  public year: number;
  public collectedVat: VatLine[];
  public deductibleVat: number; // Montant de la TVA sur achat récupérable
  
  public createdAt: Date;

  constructor(tenantId: string, month: number, year: number) {
    this.id = `CA3-${tenantId}-${year}-${month}`;
    this.tenantId = tenantId;
    this.month = month;
    this.year = year;
    this.collectedVat = [];
    this.deductibleVat = 0;
    this.createdAt = new Date();
  }

  public get totalCollectedVat(): number {
    return this.collectedVat.reduce((sum, line) => sum + line.vatAmount, 0);
  }

  public get totalToPay(): number {
    const balance = this.totalCollectedVat - this.deductibleVat;
    // La TVA à payer ne peut pas être négative. Si c'est négatif, c'est un crédit de TVA.
    return balance > 0 ? balance : 0;
  }

  public get vatCredit(): number {
    const balance = this.totalCollectedVat - this.deductibleVat;
    return balance < 0 ? Math.abs(balance) : 0;
  }
}
