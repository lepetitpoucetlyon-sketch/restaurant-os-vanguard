import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type SplitType = 'equipartition' | 'percentage' | 'custom' | 'by_item';

export interface SplitItem {
  id: string;
  name: string;
  quantity: number;
  totalInMicrounits: number;
}

export interface SplitPart {
  partIndex: number;
  label: string;
  amountInMicrounits: number;
  assignedItemIds?: string[];
}

export interface SplitBillResult {
  orderId: string;
  totalInMicrounits: number;
  splitType: SplitType;
  parts: SplitPart[];
  remainderAllocatedInMicrounits: number;
  isExactSum: boolean;
}

/**
 * SplitBillService — Angle mort A3 & Règle Invariable 5 (Microunits Split Remainder).
 * Fractionne une addition par parts égales, pourcentages ou montant custom,
 * en allouant strictement le reliquat indivisible au dernier convive pour garantir sum(parts) === total.
 */
export class SplitBillService {
  /**
   * Split par équipartition (N convives).
   */
  static splitEquipartition(
    tenantId: string,
    orderId: string,
    totalInMicrounits: number,
    numberOfGuests: number
  ): SplitBillResult {
    if (numberOfGuests <= 0) {
      throw new Error('[SPLIT-BILL] numberOfGuests must be >= 1');
    }
    if (totalInMicrounits < 0) {
      throw new Error('[SPLIT-BILL] totalInMicrounits cannot be negative');
    }

    const baseAmount = Math.floor(totalInMicrounits / numberOfGuests);
    const remainder = totalInMicrounits - (baseAmount * numberOfGuests);

    const parts: SplitPart[] = [];
    for (let i = 0; i < numberOfGuests; i++) {
      const isLast = i === numberOfGuests - 1;
      const amount = isLast ? baseAmount + remainder : baseAmount;
      parts.push({
        partIndex: i + 1,
        label: `Part ${i + 1}/${numberOfGuests}`,
        amountInMicrounits: amount,
      });
    }

    const sum = parts.reduce((acc, p) => acc + p.amountInMicrounits, 0);

    NexusEventBus.emit('pos.split_bill_processed', {
      v: 1,
      tenantId,
      orderId,
      splitType: 'equipartition',
      partsCount: numberOfGuests,
      totalInMicrounits,
      processedAt: Date.now(),
    });

    return {
      orderId,
      totalInMicrounits,
      splitType: 'equipartition',
      parts,
      remainderAllocatedInMicrounits: remainder,
      isExactSum: sum === totalInMicrounits,
    };
  }

  /**
   * Split par pourcentages définis.
   */
  static splitByPercentages(
    tenantId: string,
    orderId: string,
    totalInMicrounits: number,
    percentages: number[]
  ): SplitBillResult {
    const sumPct = percentages.reduce((acc, p) => acc + p, 0);
    if (Math.abs(sumPct - 100) > 0.001) {
      throw new Error(`[SPLIT-BILL] Sum of percentages must equal 100%, received ${sumPct}%`);
    }

    let allocated = 0;
    const parts: SplitPart[] = [];

    for (let i = 0; i < percentages.length; i++) {
      const isLast = i === percentages.length - 1;
      let amount: number;
      if (isLast) {
        // Last person takes remainder to avoid float penny leak
        amount = totalInMicrounits - allocated;
      } else {
        amount = Math.floor((totalInMicrounits * percentages[i]) / 100);
        allocated += amount;
      }

      parts.push({
        partIndex: i + 1,
        label: `Part ${i + 1} (${percentages[i]}%)`,
        amountInMicrounits: amount,
      });
    }

    const sum = parts.reduce((acc, p) => acc + p.amountInMicrounits, 0);

    NexusEventBus.emit('pos.split_bill_processed', {
      v: 1,
      tenantId,
      orderId,
      splitType: 'percentage',
      partsCount: percentages.length,
      totalInMicrounits,
      processedAt: Date.now(),
    });

    return {
      orderId,
      totalInMicrounits,
      splitType: 'percentage',
      parts,
      remainderAllocatedInMicrounits: totalInMicrounits - (allocated + (parts[parts.length - 1]?.amountInMicrounits || 0)),
      isExactSum: sum === totalInMicrounits,
    };
  }
}
