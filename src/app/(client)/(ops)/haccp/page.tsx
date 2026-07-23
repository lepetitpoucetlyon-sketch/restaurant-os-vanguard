"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    Thermometer,
    Droplets,
    SprayCan,
    AlertOctagon,
    ClipboardCheck,
    FileText,
    Download,
    CalendarCheck,
    PackageSearch,
    ShieldAlert,
    BellRing,
    Search,
    Package,
} from "lucide-react";
import { toast } from "sonner";

import {
    ReleveTemperatures,
    GestionHuiles,
    PlanNettoyage,
    GestionAnomalies,
    ProductControlList,
    SanitaryReport,
} from "@modules/compliance/haccp/components";

import { CleaningPlan } from "@/components/compliance/CleaningPlan";
import { DLCTracker } from "@/components/compliance/DLCTracker";
import { NonConformityForm } from "@/components/compliance/NonConformityForm";
import { PlanMaitriseSanitaire } from "@/domain/services/PlanMaitriseSanitaire";
import { useTenant } from "@/hooks";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { pushToRole } from '@/lib/push/pushClient';
import type { StockItem } from "@nexus/contracts";

// ── Types ──────────────────────────────────────────────────────────────────────

type HaccpTab = "haccp" | "quality" | "planning" | "compliance" | "lots";
type HaccpTool = "temperatures" | "huiles" | "nettoyage" | "anomalies";

// hac-1: Internal shape of a temperatureLog Nexus document
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

interface TempAlert {
    id: string;
    zone: string;
    temperature: number;
    type: "cold" | "hot";
    measuredAt: string;
}

// log-6: Filter state for lot traceability
interface LotFilter {
    search: string;
    supplierId: string;
    dateFrom: string;
    dateTo: string;
}

// ── Temperature thresholds ──────────────────────────────────────────────────────
const COLD_THRESHOLD = 8; // °C max for cold storage
const HOT_THRESHOLD = 63; // °C min for hot holding
const ONE_HOUR_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ── Constantes ─────────────────────────────────────────────────────────────────

const TOOLS: { id: HaccpTool; label: string; icon: typeof Thermometer }[] = [
    { id: "temperatures", label: "Températures", icon: Thermometer },
    { id: "huiles", label: "Huiles de friture", icon: Droplets },
    { id: "nettoyage", label: "Plan de nettoyage", icon: SprayCan },
    { id: "anomalies", label: "Anomalies", icon: AlertOctagon },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HaccpPage() {
    const { tenantId, activeTenantConfig } = useTenant();
    const searchParams = useSearchParams();
const _tabParam = searchParams.get("tab") as HaccpTab | null;
const _VALID_HACCP_TABS: HaccpTab[] = ["haccp", "quality", "planning", "compliance", "lots"];
const [activeTab, setActiveTab] = useState<HaccpTab>(
    _tabParam && _VALID_HACCP_TABS.includes(_tabParam) ? _tabParam : "haccp"
);
    const [activeTool, setActiveTool] = useState<HaccpTool>("temperatures");
    const [openNcCount, setOpenNcCount] = useState(0);
    const [pmsLoading, setPmsLoading] = useState(false);

    // hac-1: Active temperature alerts state
    const [tempAlerts, setTempAlerts] = useState<TempAlert[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // log-6: Lot traceability state
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [stockLoading, setStockLoading] = useState(false);
    const [lotFilter, setLotFilter] = useState<LotFilter>({
        search: "",
        supplierId: "",
        dateFrom: "",
        dateTo: "",
    });

    const handleNcCountChange = useCallback((count: number) => {
        setOpenNcCount(count);
    }, []);

    // ── hac-1: Temperature alert checker ───────────────────────────────────────
    const checkTemperatures = useCallback(async () => {
        try {
            const logs = await Nexus.adapter.query<TemperatureLogDoc>(
                "temperatureLogs",
                { orderBy: { field: "measuredAt", direction: "desc" }, limit: 10 }
            ).catch(() => [] as TemperatureLogDoc[]);

            const nowMs = Date.now();
            const activeAlerts: TempAlert[] = [];

            for (const log of logs) {
                const timestamp = log.measuredAt ?? log.recordedAt ?? "";
                const logMs = timestamp ? new Date(timestamp).getTime() : 0;
                const isRecent = nowMs - logMs < ONE_HOUR_MS;
                if (!isRecent) continue;

                const zone = log.zone ?? log.storageLocationId ?? "Zone inconnue";
                const temp = log.temperature;

                // Determine expected type: cold unless explicitly tagged as hot
                const isHot = log.type === "hot";

                if (!isHot && temp > COLD_THRESHOLD) {
                    activeAlerts.push({
                        id: log.id,
                        zone,
                        temperature: temp,
                        type: "cold",
                        measuredAt: timestamp,
                    });
                    toast.error(
                        `Alerte température froide — ${zone} : ${temp}°C (max ${COLD_THRESHOLD}°C)`,
                        { id: `temp-cold-${log.id}` }
                    );
                    if (tenantId) pushToRole(tenantId, 'chef_cuisinier', { title: 'Alerte température !', body: `${zone} : ${temp}°C (dépassement froid)`, url: '/haccp' });
                } else if (isHot && temp < HOT_THRESHOLD) {
                    activeAlerts.push({
                        id: log.id,
                        zone,
                        temperature: temp,
                        type: "hot",
                        measuredAt: timestamp,
                    });
                    toast.error(
                        `Alerte température chaude — ${zone} : ${temp}°C (min ${HOT_THRESHOLD}°C)`,
                        { id: `temp-hot-${log.id}` }
                    );
                    if (tenantId) pushToRole(tenantId, 'chef_cuisinier', { title: 'Alerte température !', body: `${zone} : ${temp}°C (dépassement chaud)`, url: '/haccp' });
                }
            }

            setTempAlerts(activeAlerts);
        } catch {
            // Silently ignore — will retry on next interval
        }
    }, []);

    useEffect(() => {
        void checkTemperatures();
        intervalRef.current = setInterval(() => void checkTemperatures(), POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkTemperatures]);

    // ── log-6: Load stock items for lot traceability ───────────────────────────
    useEffect(() => {
        if (activeTab !== "lots") return;
        let cancelled = false;

        async function loadStock() {
            setStockLoading(true);
            try {
                const items = await Nexus.adapter
                    .query<StockItem>("stockItems", {
                        orderBy: { field: "receptionDate", direction: "desc" },
                        limit: 200,
                    })
                    .catch(() => [] as StockItem[]);
                if (!cancelled) setStockItems(items);
            } finally {
                if (!cancelled) setStockLoading(false);
            }
        }

        void loadStock();
        return () => { cancelled = true; };
    }, [activeTab]);

    const handleExportPMS = async () => {
        setPmsLoading(true);
        try {
            await PlanMaitriseSanitaire.export(
                {
                    name: activeTenantConfig?.name ?? 'Mon Restaurant',
                    address: 'Adresse à compléter',
                    siret: undefined,
                },
                tenantId
            );
            toast.success("PMS exporté avec succès");
        } catch {
            toast.error("Erreur lors de la génération du PDF");
        } finally {
            setPmsLoading(false);
        }
    };

    const tabs: { id: HaccpTab; label: string; icon: typeof ClipboardCheck; badge?: number }[] = [
        { id: "haccp", label: "Relevés HACCP", icon: ClipboardCheck, badge: tempAlerts.length || undefined },
        { id: "quality", label: "Qualité & Réception", icon: FileText },
        { id: "planning", label: "Plan nettoyage", icon: CalendarCheck },
        { id: "compliance", label: "Conformité", icon: ShieldAlert, badge: openNcCount || undefined },
        { id: "lots", label: "Traçabilité lots", icon: Package },
    ];

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold">HACCP &amp; Qualité</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Relevés sanitaires, traçabilité et contrôle réception — conformité hygiène.
                    </p>
                </div>
                <button
                    onClick={handleExportPMS}
                    disabled={pmsLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-sidebar border border-border text-text-muted hover:text-text-primary text-sm font-medium transition-colors disabled:opacity-40 flex-shrink-0"
                >
                    <Download className="w-4 h-4" />
                    {pmsLoading ? "Génération..." : "Exporter PMS"}
                </button>
            </header>

            {/* hac-1: Active temperature alerts banner */}
            {tempAlerts.length > 0 && (
                <div className="mb-4 rounded-xl border border-status-danger bg-status-danger/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-status-danger font-bold text-sm">
                        <BellRing className="w-4 h-4 animate-pulse" />
                        <span>
                            {tempAlerts.length} alerte{tempAlerts.length > 1 ? "s" : ""} température active{tempAlerts.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {tempAlerts.map((alert) => (
                            <li key={alert.id} className="text-xs text-status-danger flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-status-danger inline-block" />
                                <strong>{alert.zone}</strong> — {alert.temperature}°C
                                {alert.type === "cold"
                                    ? ` (dépassement froid, max ${COLD_THRESHOLD}°C)`
                                    : ` (insuffisant pour le chaud, min ${HOT_THRESHOLD}°C)`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative ${
                                active
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge != null && tab.badge > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-status-danger text-white text-[10px] font-bold">
                                    {tab.badge > 9 ? "9+" : tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <main>
                {/* Onglet Relevés HACCP */}
                {activeTab === "haccp" && (
                    <section>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {TOOLS.map((tool) => {
                                const Icon = tool.icon;
                                const active = activeTool === tool.id;
                                return (
                                    <button
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                            active
                                                ? "bg-action-primary text-white"
                                                : "bg-surface-sidebar text-text-muted hover:text-text-primary"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tool.label}
                                    </button>
                                );
                            })}
                        </div>
                        {activeTool === "temperatures" && <ReleveTemperatures />}
                        {activeTool === "huiles" && <GestionHuiles />}
                        {activeTool === "nettoyage" && <PlanNettoyage />}
                        {activeTool === "anomalies" && <GestionAnomalies />}
                    </section>
                )}

                {/* Onglet Qualité & Réception */}
                {activeTab === "quality" && (
                    <section className="space-y-6">
                        <ProductControlList />
                        <SanitaryReport />
                    </section>
                )}

                {/* Onglet Plan de nettoyage hebdomadaire (hac-3) */}
                {activeTab === "planning" && (
                    <section>
                        <CleaningPlan />
                    </section>
                )}

                {/* Onglet Conformité (hac-4 + hac-5) */}
                {activeTab === "compliance" && (
                    <section className="space-y-8">
                        {/* DLC Tracker */}
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <PackageSearch className="w-5 h-5 text-action-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Traçabilité</span>
                            </div>
                            <DLCTracker />
                        </div>

                        {/* Non-conformités */}
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertOctagon className="w-5 h-5 text-status-danger" />
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Registre</span>
                            </div>
                            <NonConformityForm onCountChange={handleNcCountChange} />
                        </div>
                    </section>
                )}

                {/* log-6: Onglet Traçabilité des lots */}
                {activeTab === "lots" && (
                    <section className="space-y-5">
                        {/* Filtres */}
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="w-4 h-4 text-action-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                    Filtres lot
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <input
                                    type="text"
                                    placeholder="Produit ou n° lot…"
                                    value={lotFilter.search}
                                    onChange={(e) =>
                                        setLotFilter((f) => ({ ...f, search: e.target.value }))
                                    }
                                    className="col-span-2 px-3 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
                                />
                                <input
                                    type="text"
                                    placeholder="Fournisseur…"
                                    value={lotFilter.supplierId}
                                    onChange={(e) =>
                                        setLotFilter((f) => ({ ...f, supplierId: e.target.value }))
                                    }
                                    className="px-3 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={lotFilter.dateFrom}
                                        onChange={(e) =>
                                            setLotFilter((f) => ({ ...f, dateFrom: e.target.value }))
                                        }
                                        className="flex-1 px-2 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary"
                                        title="Date réception depuis"
                                    />
                                    <input
                                        type="date"
                                        value={lotFilter.dateTo}
                                        onChange={(e) =>
                                            setLotFilter((f) => ({ ...f, dateTo: e.target.value }))
                                        }
                                        className="flex-1 px-2 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary"
                                        title="Date réception jusqu'au"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table des lots */}
                        <div className="bg-surface-base rounded-2xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                                <Package className="w-4 h-4 text-action-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                    Lots en stock
                                </span>
                            </div>

                            {stockLoading ? (
                                <div className="py-8 text-center text-sm text-text-muted animate-pulse">
                                    Chargement…
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-surface-sidebar">
                                                {[
                                                    "Produit",
                                                    "N° Lot",
                                                    "Date réception",
                                                    "DLC",
                                                    "Fournisseur",
                                                    "Qté initiale",
                                                    "Qté actuelle",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockItems
                                                .filter((item) => {
                                                    const q = lotFilter.search.toLowerCase();
                                                    const matchSearch =
                                                        !q ||
                                                        (item.ingredientName ?? "")
                                                            .toLowerCase()
                                                            .includes(q) ||
                                                        (item.lotNumber ?? "")
                                                            .toLowerCase()
                                                            .includes(q) ||
                                                        (item.batchNumber ?? "")
                                                            .toLowerCase()
                                                            .includes(q);

                                                    const matchSupplier =
                                                        !lotFilter.supplierId ||
                                                        (item.supplierName ?? "")
                                                            .toLowerCase()
                                                            .includes(
                                                                lotFilter.supplierId.toLowerCase()
                                                            ) ||
                                                        (item.supplierId ?? "")
                                                            .toLowerCase()
                                                            .includes(
                                                                lotFilter.supplierId.toLowerCase()
                                                            );

                                                    const recDate = item.receptionDate ?? "";
                                                    const matchFrom =
                                                        !lotFilter.dateFrom ||
                                                        recDate >= lotFilter.dateFrom;
                                                    const matchTo =
                                                        !lotFilter.dateTo ||
                                                        recDate <= lotFilter.dateTo;

                                                    return (
                                                        matchSearch &&
                                                        matchSupplier &&
                                                        matchFrom &&
                                                        matchTo
                                                    );
                                                })
                                                .map((item) => {
                                                    const dlcDate = item.dlc ?? item.expirationDate ?? "—";
                                                    const isExpired =
                                                        dlcDate !== "—" &&
                                                        new Date(dlcDate) < new Date();

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-border last:border-0 hover:bg-surface-sidebar/50 transition-colors"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-text-primary">
                                                                {item.ingredientName}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-xs text-text-muted">
                                                                {item.lotNumber ?? item.batchNumber ?? "—"}
                                                            </td>
                                                            <td className="px-4 py-3 text-text-muted">
                                                                {item.receptionDate
                                                                    ? new Date(
                                                                          item.receptionDate
                                                                      ).toLocaleDateString("fr-FR")
                                                                    : "—"}
                                                            </td>
                                                            <td
                                                                className={`px-4 py-3 font-medium ${
                                                                    isExpired
                                                                        ? "text-status-danger"
                                                                        : "text-text-primary"
                                                                }`}
                                                            >
                                                                {dlcDate !== "—"
                                                                    ? new Date(dlcDate).toLocaleDateString(
                                                                          "fr-FR"
                                                                      )
                                                                    : "—"}
                                                                {isExpired && (
                                                                    <span className="ml-1 text-[10px] font-bold">
                                                                        EXPIRÉ
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-text-muted">
                                                                {item.supplierName ?? item.supplierId ?? "—"}
                                                            </td>
                                                            <td className="px-4 py-3 text-text-muted">
                                                                {item.initialQuantity != null
                                                                    ? `${item.initialQuantity} ${item.unit}`
                                                                    : "—"}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-text-primary">
                                                                {item.quantity} {item.unit}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {stockItems.filter((_i) => true).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-4 py-8 text-center text-sm text-text-muted"
                                                    >
                                                        Aucun lot trouvé
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
