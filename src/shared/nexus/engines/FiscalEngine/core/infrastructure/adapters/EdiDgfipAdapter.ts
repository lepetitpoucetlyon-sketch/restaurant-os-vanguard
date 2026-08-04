import { VatDeclaration } from '../../domain/entities/VatDeclaration';

export class EdiDgfipAdapter {
  /**
   * Generates an EDI-TDFC compliant string from a VatDeclaration entity.
   * This is a simplified representation of the EDIFACT standard used by DGFiP.
   */
  public static generateEdiFormat(declaration: VatDeclaration, siret: string): string {
    if (!siret || siret.length !== 14) {
      throw new Error("UNB+FATAL: Le SIRET du déclarant est invalide ou manquant.");
    }

    const lines: string[] = [];
    
    // EDI Header (Interchange)
    lines.push(`UNB+UNOA:3+${siret}+DGFIP+${this.formatDate(new Date())}+${declaration.id}'`);
    lines.push(`UNH+1+TAXCON:D:96A:UN:EDI-TDFC'`);
    
    // Period details
    const periodStr = `${declaration.year}${declaration.month.toString().padStart(2, '0')}`;
    lines.push(`DTM+324:${periodStr}:610'`); // 324 = Tax period

    // Collected VAT lines (Segment TAX)
    declaration.collectedVat.forEach((line) => {
      // 08 = Collected VAT at 20%, 09 = Collected VAT at 10%, 10 = Collected VAT at 5.5% (approx mapping)
      const taxCategory = line.rate === 20 ? '08' : line.rate === 10 ? '09' : '10';
      lines.push(`TAX+7+VAT+++:::${taxCategory}+${line.rate}'`);
      lines.push(`MOA+125:${line.baseAmount.toFixed(2)}'`); // 125 = Taxable base
      lines.push(`MOA+124:${line.vatAmount.toFixed(2)}'`);  // 124 = Tax amount
    });

    // Deductible VAT
    lines.push(`TAX+7+VAT+++:::DEDUCTIBLE'`);
    lines.push(`MOA+124:${declaration.deductibleVat.toFixed(2)}'`);

    // Totals
    const isCredit = declaration.vatCredit > 0;
    const finalAmount = isCredit ? declaration.vatCredit : declaration.totalToPay;
    const totalQualifier = isCredit ? 'CREDIT' : 'PAYABLE';
    
    lines.push(`MOA+${totalQualifier}:${finalAmount.toFixed(2)}'`);

    // Trailer
    lines.push(`UNT+${lines.length + 1}+1'`);
    lines.push(`UNZ+1+${declaration.id}'`);

    return lines.join('\n');
  }

  private static formatDate(date: Date): string {
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
    const hhmm = date.toISOString().slice(11, 16).replace(/:/g, '');
    return `${yymmdd}:${hhmm}`;
  }
}
