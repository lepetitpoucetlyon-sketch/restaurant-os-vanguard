import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { PurchaseOrder, DeliveryNote } from '@nexus/contracts';
import type { ExtractedSupplierInvoice } from '@nexus/contracts';
import { empireAudit } from '@/lib/audit';

type MatchStatus = 'matched' | 'quantity_discrepancy' | 'price_discrepancy' | 'missing_delivery' | 'missing_po' | 'blocked';

interface LineDiscrepancy {
    productId: string;
    field: 'quantity' | 'price';
    poValue: number;
    deliveredValue: number;
    invoicedValue: number;
    deltaPercent: number;
}

interface MatchResult {
    invoiceId: string;
    purchaseOrderId: string | null;
    deliveryNoteId: string | null;
    status: MatchStatus;
    discrepancies: LineDiscrepancy[];
    totalPoAmount: number;
    totalDeliveryAmount: number;
    totalInvoiceAmount: number;
}

const PRICE_TOLERANCE_PERCENT = 2;
const QUANTITY_TOLERANCE_PERCENT = 5;

export const ThreeWayMatchService = {
    async match(
        tenantId: string,
        invoice: ExtractedSupplierInvoice & { id: string }
    ): Promise<MatchResult> {
        const poRef = invoice.invoice_metadata.purchase_order_ref;

        if (!poRef) {
            return {
                invoiceId: invoice.id,
                purchaseOrderId: null,
                deliveryNoteId: null,
                status: 'missing_po',
                discrepancies: [],
                totalPoAmount: 0,
                totalDeliveryAmount: 0,
                totalInvoiceAmount: invoice.totals.total_incl_tax_cents,
            };
        }

        const pos = await Nexus.adapter.query<PurchaseOrder>(
            `tenants/${tenantId}/purchaseOrders`,
            { where: [{ field: 'id', operator: '==', value: poRef }] }
        );
        const po = pos[0];

        if (!po) {
            return {
                invoiceId: invoice.id,
                purchaseOrderId: poRef,
                deliveryNoteId: null,
                status: 'missing_po',
                discrepancies: [],
                totalPoAmount: 0,
                totalDeliveryAmount: 0,
                totalInvoiceAmount: invoice.totals.total_incl_tax_cents,
            };
        }

        const deliveries = await Nexus.adapter.query<DeliveryNote>(
            `tenants/${tenantId}/deliveryNotes`,
            { where: [{ field: 'purchaseOrderId', operator: '==', value: po.id }] }
        );
        const dn = deliveries[0];

        if (!dn) {
            return {
                invoiceId: invoice.id,
                purchaseOrderId: po.id,
                deliveryNoteId: null,
                status: 'missing_delivery',
                discrepancies: [],
                totalPoAmount: po.totalAmountInCents,
                totalDeliveryAmount: 0,
                totalInvoiceAmount: invoice.totals.total_incl_tax_cents,
            };
        }

        const discrepancies: LineDiscrepancy[] = [];

        for (const poLine of po.items) {
            const dnLine = dn.deliveredItems.find(d => d.productId === poLine.productId);
            const invLine = invoice.line_items.find(
                l => (l.supplier_product_code ?? '') === poLine.productId
            );

            const qtyOrdered = poLine.quantity;
            const qtyDelivered = dnLine?.quantityDelivered ?? 0;
            const qtyInvoiced = invLine?.quantity ?? 0;

            if (qtyOrdered > 0) {
                const qtyDelta = Math.abs(qtyDelivered - qtyOrdered) / qtyOrdered * 100;
                if (qtyDelta > QUANTITY_TOLERANCE_PERCENT) {
                    discrepancies.push({
                        productId: poLine.productId,
                        field: 'quantity',
                        poValue: qtyOrdered,
                        deliveredValue: qtyDelivered,
                        invoicedValue: qtyInvoiced,
                        deltaPercent: Math.round(qtyDelta * 100) / 100,
                    });
                }
            }

            const priceOrdered = poLine.unitPriceInCents;
            const priceInvoiced = invLine?.unit_price_cents ?? 0;

            if (priceOrdered > 0 && priceInvoiced > 0) {
                const priceDelta = Math.abs(priceInvoiced - priceOrdered) / priceOrdered * 100;
                if (priceDelta > PRICE_TOLERANCE_PERCENT) {
                    discrepancies.push({
                        productId: poLine.productId,
                        field: 'price',
                        poValue: priceOrdered,
                        deliveredValue: priceOrdered,
                        invoicedValue: priceInvoiced,
                        deltaPercent: Math.round(priceDelta * 100) / 100,
                    });
                }
            }
        }

        const status: MatchStatus = discrepancies.length > 0 ? 'blocked' : 'matched';

        if (discrepancies.length > 0) {
            empireAudit.log({
                module: 'finance',
                action: 'three_way_match_blocked',
                timestamp: new Date(),
                severity: 'medium',
                details: {
                    invoiceId: invoice.id,
                    poId: po.id,
                    dnId: dn.id,
                    discrepancyCount: discrepancies.length,
                },
            });
        }

        return {
            invoiceId: invoice.id,
            purchaseOrderId: po.id,
            deliveryNoteId: dn.id,
            status,
            discrepancies,
            totalPoAmount: po.totalAmountInCents,
            totalDeliveryAmount: dn.totalAmountInCents,
            totalInvoiceAmount: invoice.totals.total_incl_tax_cents,
        };
    },
};
