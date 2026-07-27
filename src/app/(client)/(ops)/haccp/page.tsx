"use client";

import {
    Thermometer, Droplets, SprayCan, AlertOctagon,
    Download, PackageSearch, BellRing, Search, Package,
} from "lucide-react";

import { useHaccpPage, HACCP_TOOLS } from "@/modules/compliance/haccp/hooks/useHaccpPage";
import {
    ReleveTemperatures, GestionHuiles, PlanNettoyage, GestionAnomalies,
    ProductControlList, SanitaryReport,
} from "@modules/compliance/haccp/components";
import { CleaningPlan } from "@/modules/compliance/haccp/components/CleaningPlan";
import { DLCTracker } from "@/modules/compliance/haccp/components/DLCTracker";
import { NonConformityForm } from "@/modules/compliance/haccp/components/NonConformityForm";

const TOOL_ICONS: Record<string, typeof Thermometer> = {
    temperatures: Thermometer,
    huiles: Droplets,
    nettoyage: SprayCan,
    anomalies: AlertOctagon,
};

export default function HaccpPage() {
    const {
        activeTab, setActiveTab,
        activeTool, setActiveTool,
        pmsLoading, tempAlerts,
        stockItems, stockLoading, lotFilter, setLotFilter,
        tabs,
        handleNcCountChange, handleExportPMS,
        COLD_THRESHOLD, HOT_THRESHOLD,
    } = useHaccpPage();

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold">HACCP &amp; Qualité</h1>
                    <p className="text-sm text-text-muted mt-1">Relevés sanitaires, traçabilité et contrôle réception — conformité hygiène.</p>
                </div>
                <button onClick={handleExportPMS} disabled={pmsLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-sidebar border border-border text-text-muted hover:text-text-primary text-sm font-medium transition-colors disabled:opacity-40 flex-shrink-0">
                    <Download className="w-4 h-4" />
                    {pmsLoading ? "Génération..." : "Exporter PMS"}
                </button>
            </header>

            {tempAlerts.length > 0 && (
                <div className="mb-4 rounded-xl border border-status-danger bg-status-danger/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-status-danger font-bold text-sm">
                        <BellRing className="w-4 h-4 animate-pulse" />
                        <span>{tempAlerts.length} alerte{tempAlerts.length > 1 ? "s" : ""} température active{tempAlerts.length > 1 ? "s" : ""}</span>
                    </div>
                    <ul className="space-y-1">
                        {tempAlerts.map((alert) => (
                            <li key={alert.id} className="text-xs text-status-danger flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-status-danger inline-block" />
                                <strong>{alert.zone}</strong> — {alert.temperature}°C
                                {alert.type === "cold" ? ` (dépassement froid, max ${COLD_THRESHOLD}°C)` : ` (insuffisant pour le chaud, min ${HOT_THRESHOLD}°C)`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative ${activeTab === tab.id ? "border-action-primary text-action-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}>
                            <Icon className="w-4 h-4" /> {tab.label}
                            {tab.badge != null && tab.badge > 0 && <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-status-danger text-white text-[10px] font-bold">{tab.badge > 9 ? "9+" : tab.badge}</span>}
                        </button>
                    );
                })}
            </nav>

            <main>
                {activeTab === "haccp" && (
                    <section>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {HACCP_TOOLS.map((tool) => {
                                const Icon = TOOL_ICONS[tool.id] ?? AlertOctagon;
                                return (
                                    <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${activeTool === tool.id ? "bg-action-primary text-white" : "bg-surface-sidebar text-text-muted hover:text-text-primary"}`}>
                                        <Icon className="w-3.5 h-3.5" /> {tool.label}
                                    </button>
                                );
                            })}
                        </div>
                        {activeTool === "temperatures" && <ReleveTemperatures />}
                        {activeTool === "huiles"       && <GestionHuiles />}
                        {activeTool === "nettoyage"    && <PlanNettoyage />}
                        {activeTool === "anomalies"    && <GestionAnomalies />}
                    </section>
                )}

                {activeTab === "quality" && <section className="space-y-6"><ProductControlList /><SanitaryReport /></section>}
                {activeTab === "planning" && <section><CleaningPlan /></section>}

                {activeTab === "compliance" && (
                    <section className="space-y-8">
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4"><PackageSearch className="w-5 h-5 text-action-primary" /><span className="text-xs font-bold uppercase tracking-widest text-text-muted">Traçabilité</span></div>
                            <DLCTracker />
                        </div>
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4"><AlertOctagon className="w-5 h-5 text-status-danger" /><span className="text-xs font-bold uppercase tracking-widest text-text-muted">Registre</span></div>
                            <NonConformityForm onCountChange={handleNcCountChange} />
                        </div>
                    </section>
                )}

                {activeTab === "lots" && (
                    <section className="space-y-5">
                        <div className="bg-surface-base rounded-2xl border border-border p-5">
                            <div className="flex items-center gap-2 mb-4"><Search className="w-4 h-4 text-action-primary" /><span className="text-xs font-bold uppercase tracking-widest text-text-muted">Filtres lot</span></div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <input type="text" placeholder="Produit ou n° lot…" value={lotFilter.search} onChange={(e) => setLotFilter((f) => ({ ...f, search: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary" />
                                <input type="text" placeholder="Fournisseur…" value={lotFilter.supplierId} onChange={(e) => setLotFilter((f) => ({ ...f, supplierId: e.target.value }))} className="px-3 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary" />
                                <div className="flex gap-2">
                                    <input type="date" value={lotFilter.dateFrom} onChange={(e) => setLotFilter((f) => ({ ...f, dateFrom: e.target.value }))} className="flex-1 px-2 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary" title="Date réception depuis" />
                                    <input type="date" value={lotFilter.dateTo} onChange={(e) => setLotFilter((f) => ({ ...f, dateTo: e.target.value }))} className="flex-1 px-2 py-2 rounded-lg bg-surface-sidebar border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary" title="Date réception jusqu'au" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-base rounded-2xl border border-border overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-4 border-b border-border"><Package className="w-4 h-4 text-action-primary" /><span className="text-xs font-bold uppercase tracking-widest text-text-muted">Lots en stock</span></div>
                            {stockLoading ? (
                                <div className="py-8 text-center text-sm text-text-muted animate-pulse">Chargement…</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-surface-sidebar">
                                                {["Produit", "N° Lot", "Date réception", "DLC", "Fournisseur", "Qté initiale", "Qté actuelle"].map((h) => (
                                                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockItems
                                                .filter((item) => {
                                                    const q = lotFilter.search.toLowerCase();
                                                    const matchSearch = !q || (item.ingredientName ?? "").toLowerCase().includes(q) || (item.lotNumber ?? "").toLowerCase().includes(q) || (item.batchNumber ?? "").toLowerCase().includes(q);
                                                    const matchSupplier = !lotFilter.supplierId || (item.supplierName ?? "").toLowerCase().includes(lotFilter.supplierId.toLowerCase()) || (item.supplierId ?? "").toLowerCase().includes(lotFilter.supplierId.toLowerCase());
                                                    const recDate = item.receptionDate ?? "";
                                                    return matchSearch && matchSupplier && (!lotFilter.dateFrom || recDate >= lotFilter.dateFrom) && (!lotFilter.dateTo || recDate <= lotFilter.dateTo);
                                                })
                                                .map((item) => {
                                                    const dlcDate = item.dlc ?? item.expirationDate ?? "—";
                                                    const isExpired = dlcDate !== "—" && new Date(dlcDate) < new Date();
                                                    return (
                                                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-sidebar/50 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-text-primary">{item.ingredientName}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-text-muted">{item.lotNumber ?? item.batchNumber ?? "—"}</td>
                                                            <td className="px-4 py-3 text-text-muted">{item.receptionDate ? new Date(item.receptionDate).toLocaleDateString("fr-FR") : "—"}</td>
                                                            <td className={`px-4 py-3 font-medium ${isExpired ? "text-status-danger" : "text-text-primary"}`}>
                                                                {dlcDate !== "—" ? new Date(dlcDate).toLocaleDateString("fr-FR") : "—"}
                                                                {isExpired && <span className="ml-1 text-[10px] font-bold bg-status-danger/10 text-status-danger px-1 py-0.5 rounded">PÉRIMÉ</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-text-muted">{item.supplierName ?? item.supplierId ?? "—"}</td>
                                                            <td className="px-4 py-3 tabular-nums text-text-muted">{(item as Record<string, unknown>).initialQuantity != null ? `${String((item as Record<string, unknown>).initialQuantity)} ${item.unit}` : "—"}</td>
                                                            <td className="px-4 py-3 tabular-nums font-medium text-text-primary">{item.quantity} {item.unit}</td>
                                                        </tr>
                                                    );
                                                })}
                                            {stockItems.length === 0 && !stockLoading && (
                                                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-text-muted italic">Aucun lot enregistré.</td></tr>
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
