"use client";

import {
    Thermometer, Droplets, SprayCan, AlertOctagon,
    Download, PackageSearch, BellRing, Search, Package,
    ClipboardCheck,
} from "lucide-react";

import dynamic from "next/dynamic";
import {
    useHaccpPage,
    HACCP_TOOLS,
    type TempAlert,
    type LotFilter,
} from '@/modules/compliance';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { cn } from "@/lib/ui.foundations";

const ReleveTemperatures = dynamic(() => import('@/modules/compliance/qualite/haccp/components/haccp').then(m => m.ReleveTemperatures), { ssr: false });
const GestionHuiles = dynamic(() => import('@/modules/compliance/qualite/haccp/components/haccp').then(m => m.GestionHuiles), { ssr: false });
const PlanNettoyage = dynamic(() => import('@/modules/compliance/qualite/haccp/components/haccp').then(m => m.PlanNettoyage), { ssr: false });
const GestionAnomalies = dynamic(() => import('@/modules/compliance/qualite/haccp/components/haccp').then(m => m.GestionAnomalies), { ssr: false });
const ProductControlList = dynamic(() => import('@/modules/compliance/qualite/haccp/components/quality').then(m => m.ProductControlList), { ssr: false });
const SanitaryReport = dynamic(() => import('@/modules/compliance/qualite/haccp/components/quality').then(m => m.SanitaryReport), { ssr: false });
const CleaningPlan = dynamic(() => import('@/modules/compliance/qualite/haccp/components/CleaningPlan').then(m => m.CleaningPlan), { ssr: false });
const DLCTracker = dynamic(() => import('@/modules/compliance/qualite/haccp/components/DLCTracker').then(m => m.DLCTracker), { ssr: false });
const NonConformityForm = dynamic(() => import('@/modules/compliance/qualite/haccp/components/NonConformityForm').then(m => m.NonConformityForm), { ssr: false });
const ReceptionWizard = dynamic(() => import('@/modules/compliance/qualite/haccp/components/quality/ReceptionWizard').then(m => m.ReceptionWizard), { ssr: false });
const RecallView = dynamic(() => import('@/modules/compliance/qualite/recall/RecallView').then(m => m.RecallView), { ssr: false });
const PerishableAlertsTracker = dynamic(() => import('@/modules/compliance/qualite/haccp/components/PerishableAlertsTracker').then(m => m.PerishableAlertsTracker), { ssr: false });
import type { JsonObject } from "@/shared/types/json";

const TOOL_ICONS: Record<string, typeof Thermometer> = {
    temperatures: Thermometer,
    huiles: Droplets,
    nettoyage: SprayCan,
    anomalies: AlertOctagon,
};

function HaccpPage() {
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
        <PageShell
            kicker="Conformité"
            title="HACCP & Qualité"
            subtitle="Relevés sanitaires, traçabilité et contrôle réception — conformité hygiène."
            icon={Thermometer}
            breadcrumbs={[{ label: "Opérations" }, { label: "HACCP" }]}
            alert={tempAlerts.length > 0 ? "critical" : undefined}
            status={tempAlerts.length > 0 ? { label: `${tempAlerts.length} alerte${tempAlerts.length > 1 ? "s" : ""}`, tone: "critical" } : undefined}
            actions={
                <ActionGuard page="haccp" action="archive_logs">
                    <PageShell.CTA
                        tone="ghost"
                        onClick={handleExportPMS}
                        disabled={pmsLoading}
                    >
                        <Download className="w-[15px] h-[15px]" />
                        <span>{pmsLoading ? "Génération…" : "Exporter PMS"}</span>
                    </PageShell.CTA>
                </ActionGuard>
            }
            tabs={
                <>
                    {tabs.map((tab: { id: string; label: string; icon: typeof ClipboardCheck; badge?: number }) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <TabGuard key={tab.id} pageKey="haccp" tabKey={tab.id}>
                                <PageShell.Tab
                                    active={active}
                                    onClick={() => setActiveTab(tab.id as Parameters<typeof setActiveTab>[0])}
                                    icon={Icon}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        {tab.label}
                                        {tab.badge != null && tab.badge > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-nano font-serif font-black tabular-nums">
                                                {tab.badge > 9 ? "9+" : tab.badge}
                                            </span>
                                        )}
                                    </span>
                                </PageShell.Tab>
                            </TabGuard>
                        );
                    })}
                </>
            }
        >
            {tempAlerts.length > 0 && (
                <div className="mb-6 rounded-2xl border border-status-danger/30 bg-status-danger/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-status-danger font-bold text-xs uppercase tracking-wider">
                        <BellRing className="w-4 h-4 animate-pulse" />
                        <span>{tempAlerts.length} alerte{tempAlerts.length > 1 ? "s" : ""} température active{tempAlerts.length > 1 ? "s" : ""}</span>
                    </div>
                    <ul className="space-y-1">
                        {tempAlerts.map((alert) => (
                            <li key={alert.id} className="text-xs text-status-danger flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-danger inline-block" />
                                <strong>{alert.zone}</strong> — {alert.temperature}°C
                                {alert.type === "cold" ? ` (dépassement froid, max ${COLD_THRESHOLD}°C)` : ` (insuffisant pour le chaud, min ${HOT_THRESHOLD}°C)`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <main>
                {activeTab === "haccp" && (
                    <section>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {HACCP_TOOLS.map((tool: { id: string; label: string }) => {
                                const Icon = TOOL_ICONS[tool.id] ?? AlertOctagon;
                                return (
                                    <button key={tool.id} onClick={() => setActiveTool(tool.id as Parameters<typeof setActiveTool>[0])} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${activeTool === tool.id ? "bg-action-primary text-text-on-primary" : "bg-surface-glass text-text-muted hover:text-text-primary"}`}>
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

                {activeTab === "reception" && (
                    <section className="bg-surface-card rounded-2xl border border-border-default p-6">
                        <ReceptionWizard />
                    </section>
                )}

                {activeTab === "quality" && <section className="space-y-6"><ProductControlList /><SanitaryReport /></section>}
                {activeTab === "planning" && <section><CleaningPlan /></section>}

                {activeTab === "compliance" && (
                    <section className="space-y-8">
                        <PerishableAlertsTracker />
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
                                <input type="text" placeholder="Produit ou n° lot…" value={lotFilter.search} onChange={(e) => setLotFilter((f: LotFilter) => ({ ...f, search: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg bg-surface-glass border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary" />
                                <input type="text" placeholder="Fournisseur…" value={lotFilter.supplierId} onChange={(e) => setLotFilter((f: LotFilter) => ({ ...f, supplierId: e.target.value }))} className="px-3 py-2 rounded-lg bg-surface-glass border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary" />
                                <div className="flex gap-2">
                                    <input type="date" value={lotFilter.dateFrom} onChange={(e) => setLotFilter((f: LotFilter) => ({ ...f, dateFrom: e.target.value }))} className="flex-1 px-2 py-2 rounded-lg bg-surface-glass border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary" title="Date réception depuis" />
                                    <input type="date" value={lotFilter.dateTo} onChange={(e) => setLotFilter((f: LotFilter) => ({ ...f, dateTo: e.target.value }))} className="flex-1 px-2 py-2 rounded-lg bg-surface-glass border border-border text-sm text-text-primary focus:outline-none focus:border-action-primary" title="Date réception jusqu'au" />
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
                                            <tr className="border-b border-border bg-surface-glass">
                                                {["Produit", "N° Lot", "Date réception", "DLC", "Fournisseur", "Qté initiale", "Qté actuelle"].map((h) => (
                                                    <th key={h} className="px-4 py-2.5 text-left text-nano font-bold uppercase tracking-widest text-text-muted">{h}</th>
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
                                                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-glass transition-colors">
                                                            <td className="px-4 py-3 font-medium text-text-primary">{item.ingredientName}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-text-muted">{item.lotNumber ?? item.batchNumber ?? "—"}</td>
                                                            <td className="px-4 py-3 text-text-muted">{item.receptionDate ? new Date(item.receptionDate).toLocaleDateString("fr-FR") : "—"}</td>
                                                            <td className={`px-4 py-3 font-medium ${isExpired ? "text-status-danger" : "text-text-primary"}`}>
                                                                {dlcDate !== "—" ? new Date(dlcDate).toLocaleDateString("fr-FR") : "—"}
                                                                {isExpired && <span className="ml-1 text-nano font-bold bg-status-danger/10 text-status-danger px-1 py-0.5 rounded">PÉRIMÉ</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-text-muted">{item.supplierName ?? item.supplierId ?? "—"}</td>
                                                            <td className="px-4 py-3 tabular-nums text-text-muted">{(item as JsonObject).initialQuantity != null ? `${String((item as JsonObject).initialQuantity)} ${item.unit}` : "—"}</td>
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

                {activeTab === "recall" && (
                    <section className="bg-surface-card rounded-2xl border border-border-default p-6">
                        <RecallView />
                    </section>
                )}
            </main>
        </PageShell>
    );

}

export default withPageGuard(HaccpPage, "haccp");
