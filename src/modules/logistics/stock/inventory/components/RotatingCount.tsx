"use client";

import { useState, useMemo } from "react";
import { RotateCcw, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { useInventory } from "@modules/logistics/stock/inventory";
import type { StockItem } from "@modules/logistics/stock/inventory/types";

/**
 * log-7: Rotating inventory (comptage tournant)
 *
 * Splits all ingredients across a 14-day cycle so that each day only 1/14th
 * of the stock needs a physical count. todayIndex is derived from an epoch
 * anchor so it advances consistently across sessions.
 */

// Epoch anchor — Jan 1 2024 00:00:00 UTC — do not change (would shift cycles)
const EPOCH_MS = new Date("2024-01-01T00:00:00Z").getTime();
const CYCLE_DAYS = 14;

function getTodayIndex(): number {
    return Math.floor((Date.now() - EPOCH_MS) / 86_400_000) % CYCLE_DAYS;
}

export function RotatingCount() {
    const { stockItems, isLoading } = useInventory();

    const todayIndex = useMemo(getTodayIndex, []);

    /** The batch of items to count today */
    const todaysBatch = useMemo<StockItem[]>(() => {
        const total = stockItems.length;
        if (total === 0) return [];
        const batchSize = Math.ceil(total / CYCLE_DAYS);
        const start = todayIndex * batchSize;
        return stockItems.slice(start, start + batchSize);
    }, [stockItems, todayIndex]);

    const [counts, setCounts] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (id: string, value: string) => {
        setCounts((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const now = new Date().toISOString();
        try {
            for (const item of todaysBatch) {
                const raw = counts[item.id];
                if (raw === undefined || raw === "") continue;
                const actual = parseFloat(raw);
                if (isNaN(actual) || actual < 0) continue;

                const expected = item.quantity ?? 0;
                const delta = actual - expected;

                await Nexus.adapter.update(`stockItems/${item.id}`, {
                    quantityInStock: actual,
                    quantity: actual,
                    lastPhysicalCountAt: now,
                });

                // log-7: Record any discrepancy in inventoryAdjustments
                if (Math.abs(delta) >= 0.001) {
                    await Nexus.adapter.set(
                        `inventoryAdjustments/${crypto.randomUUID()}`,
                        {
                            ingredientId: item.ingredientId,
                            expected,
                            actual,
                            delta,
                            date: Date.now(),
                            type: "rotating_count",
                        }
                    );
                }
            }
            toast.success("Comptage tournant enregistré.");
            setCounts({});
        } catch {
            toast.error("Erreur lors de l'enregistrement du comptage.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-lg border border-border p-6 bg-surface-sidebar animate-pulse">
                <div className="h-4 bg-surface-hover rounded w-1/3" />
            </div>
        );
    }

    const hasCounts = Object.values(counts).some((v) => v !== "");

    return (
        <div className="rounded-lg border border-border bg-surface-sidebar overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-action-primary" />
                <h3 className="text-sm font-semibold">
                    Comptage tournant — Lot {todayIndex + 1}/{CYCLE_DAYS}
                </h3>
                <span className="ml-auto text-xs text-text-muted">
                    {todaysBatch.length} article(s) à compter aujourd&apos;hui
                </span>
            </div>

            {todaysBatch.length === 0 ? (
                <p className="px-4 py-8 text-sm text-text-muted italic text-center">
                    Aucun article à compter aujourd&apos;hui.
                </p>
            ) : (
                <>
                    <div className="divide-y divide-border">
                        {todaysBatch.map((item) => {
                            const expected = item.quantity ?? 0;
                            const rawCount = counts[item.id];
                            const actual =
                                rawCount !== undefined
                                    ? parseFloat(rawCount)
                                    : undefined;
                            const isDifferent =
                                actual !== undefined &&
                                !isNaN(actual) &&
                                Math.abs(actual - expected) >= 0.001;

                            return (
                                <div
                                    key={item.id}
                                    className="px-4 py-3 flex items-center gap-3"
                                >
                                    <Package className="w-4 h-4 text-text-muted shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {item.name ?? item.ingredientName}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            Attendu&nbsp;:{" "}
                                            <strong>
                                                {expected} {item.unit}
                                            </strong>
                                        </p>
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={rawCount ?? ""}
                                        onChange={(e) =>
                                            handleChange(item.id, e.target.value)
                                        }
                                        placeholder={String(expected)}
                                        className="w-24 px-2 py-1.5 rounded border border-border bg-surface-base text-sm text-right focus:outline-none focus:ring-2 focus:ring-action-primary tabular-nums"
                                    />

                                    <span className="text-xs text-text-muted w-8">
                                        {item.unit}
                                    </span>

                                    {actual !== undefined && !isNaN(actual) && (
                                        <CheckCircle
                                            className={`w-4 h-4 shrink-0 ${
                                                isDifferent
                                                    ? "text-action-primary"
                                                    : "text-status-success"
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4">
                        <p className="text-xs text-text-muted">
                            Les écarts sont enregistrés comme ajustements de stock.
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !hasCounts}
                            className="px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                            {submitting ? "Enregistrement…" : "Valider le comptage"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
