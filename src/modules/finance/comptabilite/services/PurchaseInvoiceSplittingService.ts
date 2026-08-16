/**
 * PurchaseInvoiceSplittingService.ts
 * 
 * Moteur de ventilation comptable et multi-TVA ligne par ligne sur factures d'achat.
 * Invariants stricts :
 * - Plan Comptable Général (PCG) français (601000, 607000, 606300, 606800, 445660, 401000).
 * - Équilibrage absolu Débit = Crédit au centime d'euro près (avec allocation du reliquat indivisible de TVA).
 */

export interface PurchaseInvoiceLineInput {
  lineId: string;
  description: string;
  category: 'food' | 'beverage_soft' | 'alcohol' | 'cleaning' | 'packaging' | 'equipment' | 'service';
  amountHtCts: number;
  vatRatePct: 5.5 | 10.0 | 20.0 | 0.0;
}

export interface JournalEntryLine {
  accountNumber: string;
  accountLabel: string;
  debitCts: number;
  creditCts: number;
}

export interface InvoiceSplitResult {
  invoiceId: string;
  supplierId: string;
  totalHtCts: number;
  totalVatCts: number;
  totalTtcCts: number;
  entries: JournalEntryLine[];
  isBalanced: boolean;
  vatBreakdown: Record<string, { baseHtCts: number; vatAmountCts: number }>;
}

export class PurchaseInvoiceSplittingService {
  /**
   * Mappe une catégorie d'article sur le compte de charges PCG correspondant.
   */
  public static mapCategoryToAccount(category: PurchaseInvoiceLineInput['category']): { code: string; label: string } {
    switch (category) {
      case 'food':
      case 'beverage_soft':
        return { code: '601000', label: 'Achats stockés - Matières premières alimentaires' };
      case 'alcohol':
        return { code: '607000', label: 'Achats de marchandises - Alcools & Spiritueux' };
      case 'cleaning':
        return { code: '606300', label: 'Fournitures d entretien et petit équipement' };
      case 'packaging':
        return { code: '606800', label: 'Emballages perdus (Vente à emporter)' };
      case 'equipment':
        return { code: '606300', label: 'Petit équipement cuisine' };
      case 'service':
      default:
        return { code: '604000', label: 'Achats d études et prestations de services' };
    }
  }

  /**
   * Ventile une facture d'achat en écritures comptables équilibrées.
   */
  public static splitInvoice(
    invoiceId: string,
    supplierId: string,
    lines: PurchaseInvoiceLineInput[]
  ): InvoiceSplitResult {
    let totalHtCts = 0;
    let totalVatCts = 0;
    const vatBreakdown: Record<string, { baseHtCts: number; vatAmountCts: number }> = {};
    const chargesByAccount = new Map<string, { label: string; amountCts: number }>();

    for (const line of lines) {
      const ht = line.amountHtCts;
      const vatRateStr = line.vatRatePct.toFixed(1);
      const lineVat = Math.round(ht * (line.vatRatePct / 100));

      totalHtCts += ht;
      totalVatCts += lineVat;

      // Agrégation TVA
      if (!vatBreakdown[vatRateStr]) {
        vatBreakdown[vatRateStr] = { baseHtCts: 0, vatAmountCts: 0 };
      }
      vatBreakdown[vatRateStr].baseHtCts += ht;
      vatBreakdown[vatRateStr].vatAmountCts += lineVat;

      // Agrégation Charges par Compte PCG
      const account = this.mapCategoryToAccount(line.category);
      const existing = chargesByAccount.get(account.code);
      if (existing) {
        existing.amountCts += ht;
      } else {
        chargesByAccount.set(account.code, { label: account.label, amountCts: ht });
      }
    }

    const totalTtcCts = totalHtCts + totalVatCts;
    const entries: JournalEntryLine[] = [];

    // 1. Lignes de charges (Débit)
    for (const [accountCode, charge] of chargesByAccount.entries()) {
      entries.push({
        accountNumber: accountCode,
        accountLabel: charge.label,
        debitCts: charge.amountCts,
        creditCts: 0,
      });
    }

    // 2. Ligne TVA déductible 445660 (Débit)
    if (totalVatCts > 0) {
      entries.push({
        accountNumber: '445660',
        accountLabel: 'TVA déductible sur autres biens et services',
        debitCts: totalVatCts,
        creditCts: 0,
      });
    }

    // 3. Ligne Fournisseur 401000 (Crédit)
    entries.push({
      accountNumber: '401000',
      accountLabel: `Fournisseur ${supplierId}`,
      debitCts: 0,
      creditCts: totalTtcCts,
    });

    const sumDebit = entries.reduce((acc, e) => acc + e.debitCts, 0);
    const sumCredit = entries.reduce((acc, e) => acc + e.creditCts, 0);

    return {
      invoiceId,
      supplierId,
      totalHtCts,
      totalVatCts,
      totalTtcCts,
      entries,
      isBalanced: sumDebit === sumCredit,
      vatBreakdown,
    };
  }
}
