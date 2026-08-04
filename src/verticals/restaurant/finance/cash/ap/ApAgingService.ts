import { Nexus } from '@/lib/nexus/NexusAdapter';

interface SupplierInvoiceRecord {
    id: string;
    supplierId: string;
    supplierName: string;
    invoiceNumber: string;
    totalIncTaxCents: number;
    issuedAt: string;
    dueDate: string;
    paidAt?: string;
    status: 'pending' | 'approved' | 'paid' | 'disputed';
}

interface AgingBucket {
    label: string;
    minDays: number;
    maxDays: number | null;
    totalCents: number;
    count: number;
    invoices: SupplierInvoiceRecord[];
}

interface AgingReport {
    asOfDate: string;
    buckets: AgingBucket[];
    totalOutstandingCents: number;
    totalOverdueCents: number;
}

const BUCKET_DEFS: Array<{ label: string; min: number; max: number | null }> = [
    { label: 'Non échu', min: -Infinity, max: 0 },
    { label: '1-30 jours', min: 1, max: 30 },
    { label: '31-60 jours', min: 31, max: 60 },
    { label: '61-90 jours', min: 61, max: 90 },
    { label: '90+ jours', min: 91, max: null },
];

export const ApAgingService = {
    async generateReport(tenantId: string): Promise<AgingReport> {
        const invoices = await Nexus.adapter.query<SupplierInvoiceRecord>(
            `tenants/${tenantId}/supplierInvoices`,
            { where: [{ field: 'status', operator: 'in', value: ['pending', 'approved'] }] }
        );

        const now = Date.now();
        const asOfDate = new Date(now).toISOString().slice(0, 10);

        const buckets: AgingBucket[] = BUCKET_DEFS.map(def => ({
            label: def.label,
            minDays: def.min === -Infinity ? -9999 : def.min,
            maxDays: def.max,
            totalCents: 0,
            count: 0,
            invoices: [],
        }));

        let totalOutstanding = 0;
        let totalOverdue = 0;

        for (const inv of invoices) {
            const dueMs = new Date(inv.dueDate).getTime();
            const daysOverdue = Math.floor((now - dueMs) / (86400 * 1000));

            totalOutstanding += inv.totalIncTaxCents;
            if (daysOverdue > 0) totalOverdue += inv.totalIncTaxCents;

            for (const bucket of buckets) {
                const min = bucket.minDays === -9999 ? -Infinity : bucket.minDays;
                const max = bucket.maxDays ?? Infinity;
                if (daysOverdue >= min && daysOverdue <= max) {
                    bucket.totalCents += inv.totalIncTaxCents;
                    bucket.count++;
                    bucket.invoices.push(inv);
                    break;
                }
            }
        }

        return {
            asOfDate,
            buckets,
            totalOutstandingCents: totalOutstanding,
            totalOverdueCents: totalOverdue,
        };
    },
};
