"use client";

import { useState, useEffect, useRef } from "react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { StockItem } from "@/modules/ops";

const POLL_INTERVAL_MS = 30_000; // Re-check every 30 seconds

/**
 * useStockAlerts
 *
 * Polls Nexus for stockItems with quantityInStock <= 0 and returns
 * a Set<string> of product names that are out of stock.
 *
 * Match strategy (in order):
 *   1. stockItem.productId === product.id  (if available in inventory data)
 *   2. stockItem.name.toLowerCase() === product.name.toLowerCase()  (fuzzy by name)
 *
 * The Set contains both IDs (when productId is present) and lowercased names
 * so callers can check against either field.
 */
export function useStockAlerts(): Set<string> {
    const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOutOfStock = async () => {
        try {
            const path = Nexus.getTenantPath("stock_items");
            const items = await Nexus.adapter.query<StockItem & { productId?: string }>(path, {
                where: [{ field: "quantityInStock", operator: "<=", value: 0 }],
            });

            const ids = new Set<string>();
            for (const item of items) {
                // Match by productId reference if present
                if (item.productId) ids.add(item.productId);
                // Always also index by name (lowercased) for name-based lookup
                if (item.name) ids.add(item.name.toLowerCase());
            }
            setOutOfStockIds(ids);
        } catch {
            // Silently ignore — stock alerts are non-critical; POS must not break
        }
    };

    useEffect(() => {
        fetchOutOfStock();
        timerRef.current = setInterval(fetchOutOfStock, POLL_INTERVAL_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
     
    }, []);

    return outOfStockIds;
}
