"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    startOfDay, startOfWeek, startOfMonth,
    subDays, subWeeks, subMonths,
    eachDayOfInterval, format,
} from "date-fns";
import { fr } from "date-fns/locale";

// FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
// eslint-disable-next-line vanguard/no-inter-module-imports
import { useQuality } from "@modules/compliance";
import type { ComplianceAlert } from "@/domain/schemas/compliance.schemas";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useOrders, useTables } from "@/modules/ops";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { Nexus } from "@/lib/nexus/NexusAdapter";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { predictAttendance } from "@/modules/intelligence/attendance";

export type AnalyticsTab = "profitability" | "reputation" | "compliance" | "oracle";
const VALID_ANALYTICS_TABS: AnalyticsTab[] = ["profitability", "reputation", "compliance", "oracle"];

export interface MacroBrainAlert {
    id: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    suggestedAction?: string;
    timestamp: number;
}

interface OrderLike {
    status: string;
    totalInMicrounits?: number | null;
    totalInCents?: number | null;
    createdAt: number;
    covers?: number;
    items?: Array<{ name: string; productId: string; quantity: number }>;
}

function revenueForRange(orders: OrderLike[], start: Date, end: Date): number {
    return SovereignMath.fromMicrounits(
        orders
            .filter((o) => {
                const d = new Date(o.createdAt);
                return d >= start && d <= end && (o.status === "paid" || o.status === "delivered");
            })
            .reduce((acc, o) => SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o)), 0)
    );
}

export function percentChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+∞ %" : "—";
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct >= 0 ? `+${pct} %` : `${pct} %`;
}

export function useAnalyticsPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as AnalyticsTab | null;
    const [activeTab, setActiveTab] = useState<AnalyticsTab>(
        tabParam && VALID_ANALYTICS_TABS.includes(tabParam) ? tabParam : "profitability"
    );
    const [macroAlerts, setMacroAlerts] = useState<MacroBrainAlert[]>([]);
    const [attendance, setAttendance] = useState<{ low: number; median: number; high: number; label: string; } | null>(null);

    const { alerts: qualityAlerts } = useQuality();
    const { data: orders } = useOrders();
    const { tables } = useTables();

    const complianceAlerts = useMemo<ComplianceAlert[]>(
        () => qualityAlerts.map((c) => ({
            id: c.id,
            userName: c.controller_name ?? c.supplier_name ?? c.id,
            message: `Contrôle ${c.control_number ?? c.id} — ${c.summary?.overall_status ?? "non-conforme"}`,
        })),
        [qualityAlerts]
    );

    const now = new Date();

    const todayCA = useMemo(() => revenueForRange(orders, startOfDay(now), now), [orders]);
    const yesterdayCA = useMemo(() => {
        const midnight = startOfDay(now);
        return revenueForRange(orders, startOfDay(subDays(now, 1)), new Date(midnight.getTime() - 1));
    }, [orders]);

    const weekCA = useMemo(() => revenueForRange(orders, startOfWeek(now, { weekStartsOn: 1 }), now), [orders]);
    const prevWeekCA = useMemo(() => {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        return revenueForRange(orders, subWeeks(weekStart, 1), new Date(weekStart.getTime() - 1));
    }, [orders]);

    const monthCA = useMemo(() => revenueForRange(orders, startOfMonth(now), now), [orders]);
    const prevMonthCA = useMemo(() => {
        const thisMonthStart = startOfMonth(now);
        return revenueForRange(orders, startOfMonth(subMonths(now, 1)), new Date(thisMonthStart.getTime() - 1));
    }, [orders]);

    const chartData = useMemo(() => {
        const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
        return days.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = new Date(dayStart.getTime() + 86_399_999);
            return {
                label: format(day, "d", { locale: fr }),
                fullLabel: format(day, "dd/MM", { locale: fr }),
                revenue: revenueForRange(orders, dayStart, dayEnd),
            };
        });
    }, [orders]);

    const maxChartRevenue = useMemo(() => Math.max(...chartData.map((d) => d.revenue), 1), [chartData]);

    const top5Products = useMemo(() => {
        const counts = new Map<string, { name: string; count: number }>();
        for (const o of orders) {
            if (o.status !== "paid" && o.status !== "delivered") continue;
            for (const item of o.items ?? []) {
                const prev = counts.get(item.productId);
                if (prev) prev.count += item.quantity;
                else counts.set(item.productId, { name: item.name, count: item.quantity });
            }
        }
        return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [orders]);

    const { totalSeats, occupiedSeats, occupancyRate, avgCoversPerService } = useMemo(() => {
        const activeStatuses = new Set(["seated", "ordered", "eating", "paying", "occupied"]);
        const total = tables.reduce((acc, t) => acc + (t.seats ?? 0), 0);
        const occupied = tables.filter((t) => activeStatuses.has(t.status)).reduce((acc, t) => acc + (t.seats ?? 0), 0);
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "delivered");
        const totalCoversSum = paidOrders.reduce((acc, o) => acc + (o.covers ?? 0), 0);
        return {
            totalSeats: total,
            occupiedSeats: occupied,
            occupancyRate: rate,
            avgCoversPerService: paidOrders.length > 0 ? Math.round(totalCoversSum / paidOrders.length) : 0,
        };
    }, [tables, orders]);

    useEffect(() => {
        const tenantId = Nexus.activeTenant;
        const path = tenantId ? `tenants/${tenantId}/macrobrain_alerts` : "macrobrain_alerts";
        Nexus.adapter
            .query<MacroBrainAlert>(path, { orderBy: { field: "timestamp", direction: "desc" }, limit: 5 })
            .then(setMacroAlerts)
            .catch(() => setMacroAlerts([]));
    }, []);

    useEffect(() => {
        const tenantId = Nexus.activeTenant ?? undefined;
        const t = new Date();
        const hour = t.getHours();
        let targetDate: Date;
        let serviceLabel: string;
        if (hour < 12) { targetDate = t; serviceLabel = `${format(t, "EEEE", { locale: fr })} déjeuner`; }
        else if (hour < 22) { targetDate = t; serviceLabel = `${format(t, "EEEE", { locale: fr })} dîner`; }
        else { targetDate = new Date(t.getTime() + 24 * 60 * 60 * 1000); serviceLabel = `${format(targetDate, "EEEE", { locale: fr })} déjeuner`; }
        predictAttendance(targetDate.getTime(), tenantId)
            .then((result) => setAttendance({ ...result, label: serviceLabel }))
            .catch(() => setAttendance(null));
    }, []);

    return {
        activeTab, setActiveTab,
        macroAlerts,
        attendance,
        complianceAlerts,
        todayCA, yesterdayCA,
        weekCA, prevWeekCA,
        monthCA, prevMonthCA,
        chartData, maxChartRevenue,
        top5Products,
        totalSeats, occupiedSeats, occupancyRate, avgCoversPerService,
    };
}
