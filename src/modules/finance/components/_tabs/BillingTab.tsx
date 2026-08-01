"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { FacturXDownloadButton } from "@/modules/finance/components/FacturXDownloadButton";
import type { Order } from "@/domain/schemas/orders";
import { useBilling } from "@/modules/finance/comptabilite/billing/hooks";

/**
 * Onglet « Facturation » de la page Finance — extrait de page.tsx (dette-4).
 */
export interface BillingTabProps {
    paidOrders: Order[];
    ordersLoading: boolean;
}

export function BillingTab({ paidOrders, ordersLoading }: BillingTabProps) {
    const [billingOrder, setBillingOrder] = useState<string | null>(null);
    const { billOrder } = useBilling();

    const onBillOrder = useCallback(async (order: Order) => {
        setBillingOrder(order.id);
        try {
            await billOrder(order);
        } finally {
            setBillingOrder(null);
        }
    }, [billOrder]);
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold">Factures émises</h2>
                <span className="text-xs text-text-muted">
                    {paidOrders.length} commande{paidOrders.length !== 1 ? "s" : ""} facturée{paidOrders.length !== 1 ? "s" : ""}
                </span>
            </div>

            {ordersLoading ? (
                <p className="text-sm text-text-muted italic py-8 text-center">Chargement…</p>
            ) : paidOrders.length === 0 ? (
                <p className="text-sm text-text-muted italic py-8 text-center">
                    Aucune commande réglée — les factures apparaissent ici automatiquement.
                </p>
            ) : (
                <div className="space-y-2">
                    {paidOrders.map((order) => (
                        <div
                            key={order.id}
                            className="rounded-lg border border-border p-4 flex items-center justify-between bg-surface-sidebar"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-text-muted shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">
                                        FACT-{new Date().getFullYear()}-{order.id.slice(-6).toUpperCase()}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        Table {order.tableId ?? "Emporté"} · Commande {order.id.slice(-8)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => onBillOrder(order)}
                                    disabled={billingOrder === order.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-action-primary hover:text-text-primary hover:border-action-primary transition-colors disabled:opacity-50"
                                >
                                    {billingOrder === order.id ? "Émission…" : "Émettre facture"}
                                </button>
                                {/* fin-9: Factur-X XML (e-facturation B2B 2026) */}
                                <FacturXDownloadButton
                                    invoiceId={order.id}
                                    filename={`facturx_FACT-${new Date().getFullYear()}-${order.id.slice(-6).toUpperCase()}.xml`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
