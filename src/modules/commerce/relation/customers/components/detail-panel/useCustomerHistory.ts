import { useState, useEffect } from "react";
import type { Customer, Reservation } from "@nexus/contracts";
import type { Order } from "@/modules/ops";
import { Nexus } from "@/lib/nexus/NexusAdapter";

export interface CustomerHistory {
    reservations: Reservation[];
    orders: Order[];
    avgSpend: number;
    topProducts: { name: string; count: number }[];
}

export function useCustomerHistory(customer: Customer): { data: CustomerHistory | null; loading: boolean } {
    const [data, setData] = useState<CustomerHistory | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                // Query reservations by customerId
                const reservations = await Nexus.adapter.query<Reservation>("reservations", {
                    where: [{ field: "customerId", operator: "==", value: customer.id }],
                    orderBy: { field: "date", direction: "desc" },
                    limit: 20,
                }).catch(() => [] as Reservation[]);

                // Query orders by customerId
                const orders = await Nexus.adapter.query<Order>("orders", {
                    where: [{ field: "customerId", operator: "==", value: customer.id }],
                    orderBy: { field: "createdAt", direction: "desc" },
                    limit: 50,
                }).catch(() => [] as Order[]);

                if (cancelled) return;

                // Average spend in euros
                const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "served");
                const totalMicrounits = paidOrders.reduce((sum, o) => {
                    const mu = o.totalInMicrounits ?? (o.totalInCents ? o.totalInCents * 10_000 : 0);
                    return sum + mu;
                }, 0);
                const avgSpend = paidOrders.length > 0
                    ? totalMicrounits / paidOrders.length / 1_000_000
                    : (customer.averageSpendInMicrounits ?? (customer.averageSpendInCents ? customer.averageSpendInCents * 10_000 : 0)) / 1_000_000;

                // Top products from order items
                const productCount: Record<string, { name: string; count: number }> = {};
                for (const order of orders) {
                    for (const item of order.items) {
                        const key = item.productId;
                        productCount[key] = productCount[key]
                            ? { name: item.name, count: productCount[key].count + item.quantity }
                            : { name: item.name, count: item.quantity };
                    }
                }
                const topProducts = Object.values(productCount)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);

                setData({ reservations, orders, avgSpend, topProducts });
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [customer.id, customer.averageSpendInMicrounits, customer.averageSpendInCents]);

    return { data, loading };
}
