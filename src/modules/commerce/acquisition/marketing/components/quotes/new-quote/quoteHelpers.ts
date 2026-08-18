import type { QuoteLine } from '../../../types';
import { Quote } from '@nexus/contracts';

export type QuoteProduct = { id?: string; name?: string; priceInMicrounits?: number; priceInCents?: number; unitCostInCents?: number };

export function recalculateLineTotals(line: Partial<QuoteLine>): Partial<QuoteLine> {
    const q = line.quantity || 0;
    const p = line.unitPriceHTInMicrounits || 0;
    const v = line.vatRate || 20;
    const totalHT = Math.round(q * p);
    const vatAmount = Math.round(totalHT * (v / 100));
    return { ...line, totalHTInMicrounits: totalHT, vatAmountInMicrounits: vatAmount, totalTTCInMicrounits: totalHT + vatAmount };
}

export function buildQuotePayload(
    lines: Partial<QuoteLine>[],
    crmName: string,
    subject: string,
    selectedCRMId: string | undefined,
    totals: { totalHTInMicrounits: number; totalVATInMicrounits: number; totalTTCInMicrounits: number },
): Partial<Quote> {
    return {
        customerId: selectedCRMId || 'ORPHAN',
        customerName: crmName,
        title: subject,
        items: lines.map(l => ({
            id: l.id!,
            name: l.designation!,
            quantity: l.quantity || 1,
            priceInMicrounits: l.unitPriceHTInMicrounits || 0,
            priceInCents: Math.round((l.unitPriceHTInMicrounits || 0) / 10_000),
        })),
        amountInMicrounits: totals.totalTTCInMicrounits,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft' as const,
        totals: {
            totalHTInMicrounits:       totals.totalHTInMicrounits,
            totalTTCInMicrounits:      totals.totalTTCInMicrounits,
            totalTaxInMicrounits:      totals.totalVATInMicrounits,
            totalDiscountInMicrounits: 0,
        },
    };
}

export function needsRecalculation(updates: Partial<QuoteLine>): boolean {
    return updates.quantity !== undefined || updates.unitPriceHTInMicrounits !== undefined || updates.vatRate !== undefined;
}
