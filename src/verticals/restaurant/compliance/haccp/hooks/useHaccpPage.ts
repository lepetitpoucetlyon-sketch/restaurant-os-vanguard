"use client";


import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useTenant } from "@/shared/hooks";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { pushToRole } from "@/lib/push/pushClient";
import { PlanMaitriseSanitaire } from '@/modules/compliance';
import type { StockItem } from "@nexus/contracts";
import {
    ClipboardCheck, FileText, CalendarCheck, ShieldAlert, Package,
} from "lucide-react";

export type HaccpTab = "haccp" | "quality" | "planning" | "compliance" | "lots";
export type HaccpTool = "temperatures" | "huiles" | "nettoyage" | "anomalies";

interface TemperatureLogDoc {
    id: string;
    zone?: string;
    storageLocationId?: string;
    temperature: number;
    type?: "cold" | "hot" | "ambient";
    measuredAt?: string;
    recordedAt?: string;
    isCompliant?: boolean;
}

export interface TempAlert {
    id: string;
    zone: string;
    temperature: number;
    type: "cold" | "hot";
    measuredAt: string;
}

export interface LotFilter {
    search: string;
    supplierId: string;
    dateFrom: string;
    dateTo: string;
}

const COLD_THRESHOLD = 8;
const HOT_THRESHOLD = 63;
const ONE_HOUR_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 15 * 60 * 1000;
const VALID_HACCP_TABS: HaccpTab[] = ["haccp", "quality", "planning", "compliance", "lots"];

export function resolveInitialTab(tabParam: HaccpTab | null): HaccpTab {
    return tabParam && VALID_HACCP_TABS.includes(tabParam) ? tabParam : "haccp";
}

export function buildTempAlertFromLog(log: TemperatureLogDoc, nowMs: number): TempAlert | null {
    const timestamp = log.measuredAt ?? log.recordedAt ?? "";
    if (!timestamp || nowMs - new Date(timestamp).getTime() >= ONE_HOUR_MS) return null;
    const zone = log.zone ?? log.storageLocationId ?? "Zone inconnue";
    const temp = log.temperature;
    if (log.type !== "hot" && temp > COLD_THRESHOLD) return { id: log.id, zone, temperature: temp, type: "cold", measuredAt: timestamp };
    if (log.type === "hot" && temp < HOT_THRESHOLD) return { id: log.id, zone, temperature: temp, type: "hot", measuredAt: timestamp };
    return null;
}

function emitTempAlert(alert: TempAlert, tenantId: string | undefined): void {
    const isCold = alert.type === "cold";
    const threshold = isCold ? COLD_THRESHOLD : HOT_THRESHOLD;
    const minMax = isCold ? "max" : "min";
    const dir = isCold ? "froide" : "chaude";
    const overDir = isCold ? "froid" : "chaud";
    toast.error(`Alerte température ${dir} — ${alert.zone} : ${alert.temperature}°C (${minMax} ${threshold}°C)`, { id: `temp-${alert.type}-${alert.id}` });
    if (tenantId) pushToRole(tenantId, 'chef_cuisinier', { title: 'Alerte température !', body: `${alert.zone} : ${alert.temperature}°C (dépassement ${overDir})`, url: '/haccp' });
}

export const HACCP_TOOLS: { id: HaccpTool; label: string }[] = [
    { id: "temperatures", label: "Températures" },
    { id: "huiles",       label: "Huiles de friture" },
    { id: "nettoyage",    label: "Plan de nettoyage" },
    { id: "anomalies",    label: "Anomalies" },
];

export function useHaccpPage() {
    const { tenantId, activeTenantConfig } = useTenant();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as HaccpTab | null;
    const [activeTab, setActiveTab] = useState<HaccpTab>(resolveInitialTab(tabParam));
    const [activeTool, setActiveTool] = useState<HaccpTool>("temperatures");
    const [openNcCount, setOpenNcCount] = useState(0);
    const [pmsLoading, setPmsLoading] = useState(false);
    const [tempAlerts, setTempAlerts] = useState<TempAlert[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [stockLoading, setStockLoading] = useState(false);
    const [lotFilter, setLotFilter] = useState<LotFilter>({ search: "", supplierId: "", dateFrom: "", dateTo: "" });

    const handleNcCountChange = useCallback((count: number) => { setOpenNcCount(count); }, []);

    const checkTemperatures = useCallback(async () => {
        try {
            const logs = await Nexus.adapter.query<TemperatureLogDoc>("temperatureLogs", { orderBy: { field: "measuredAt", direction: "desc" }, limit: 10 }).catch(() => [] as TemperatureLogDoc[]);
            const nowMs = Date.now();
            const activeAlerts: TempAlert[] = [];
            for (const log of logs) {
                const alert = buildTempAlertFromLog(log, nowMs);
                if (alert) { activeAlerts.push(alert); emitTempAlert(alert, tenantId); }
            }
            setTempAlerts(activeAlerts);
        } catch { /* silently retry */ }
    }, [tenantId]);

    useEffect(() => {
        void checkTemperatures();
        intervalRef.current = setInterval(() => void checkTemperatures(), POLL_INTERVAL_MS);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [checkTemperatures]);

    useEffect(() => {
        if (activeTab !== "lots") return;
        let cancelled = false;
        (async () => {
            setStockLoading(true);
            try {
                const items = await Nexus.adapter.query<StockItem>("stockItems", { orderBy: { field: "receptionDate", direction: "desc" }, limit: 200 }).catch(() => [] as StockItem[]);
                if (!cancelled) setStockItems(items);
            } finally { if (!cancelled) setStockLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [activeTab]);

    const handleExportPMS = async () => {
        setPmsLoading(true);
        try {
            await PlanMaitriseSanitaire.export({ name: activeTenantConfig?.name ?? 'Mon Restaurant', address: 'Adresse à compléter', siret: undefined }, tenantId);
            toast.success("PMS exporté avec succès");
        } catch { toast.error("Erreur lors de la génération du PDF"); }
        finally { setPmsLoading(false); }
    };

    const tabs = [
        { id: "haccp" as const, label: "Relevés HACCP", icon: ClipboardCheck, badge: tempAlerts.length || undefined },
        { id: "quality" as const, label: "Qualité & Réception", icon: FileText },
        { id: "planning" as const, label: "Plan nettoyage", icon: CalendarCheck },
        { id: "compliance" as const, label: "Conformité", icon: ShieldAlert, badge: openNcCount || undefined },
        { id: "lots" as const, label: "Traçabilité lots", icon: Package },
    ];

    return {
        activeTab, setActiveTab,
        activeTool, setActiveTool,
        openNcCount, pmsLoading,
        tempAlerts, stockItems, stockLoading,
        lotFilter, setLotFilter,
        tabs,
        handleNcCountChange,
        handleExportPMS,
        COLD_THRESHOLD, HOT_THRESHOLD,
    };
}
