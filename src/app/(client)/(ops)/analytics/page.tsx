"use client";

import {
    TrendingUp, TrendingDown, Star, ShieldCheck, Brain, Package,
    Users, AlertTriangle, Zap, Lightbulb, ChevronRight, BarChart2,
} from "lucide-react";
import { format } from "date-fns";

import { useAnalyticsPage, percentChange, type MacroBrainAlert } from '@/modules/finance';
import { withPageGuard } from "@design/rbac/PageGuard";
import { TabGuard } from "@design/rbac/TabGuard";
import { useTabAccess } from "@/shared/hooks/useTabAccess";
import dynamic from "next/dynamic";

const ProfitabilityView = dynamic(() => import("@modules/intelligence/analytique/analytics/components").then(m => m.ProfitabilityView));
const ReputationView = dynamic(() => import("@modules/intelligence/analytique/analytics/components").then(m => m.ReputationView));
const ComplianceView = dynamic(() => import("@modules/intelligence/analytique/analytics/components").then(m => m.ComplianceView));
const MenuEngineeringMatrix = dynamic(() => import("@modules/intelligence/analytique/analytics/components").then(m => m.MenuEngineeringMatrix));

import { GlassCard } from "@design/ui/glass";

// ── Local sub-components (presentation only) ──────────────────────────────────

function KpiCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
    return (
        <GlassCard variant="light" lift className="p-4 flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted relative z-10">{label}</p>
            <p className="text-2xl font-light tracking-tight text-text-primary relative z-10">{value}</p>
            <span className={`relative z-10 inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[9px] font-bold ${up ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
            </span>
        </GlassCard>
    );
}

function AlertCard({ alert }: { alert: MacroBrainAlert }) {
    const colorMap: Record<MacroBrainAlert["severity"], "danger" | "primary" | "none"> = {
        critical: "danger",
        warning: "primary",
        info: "none",
    };
    const IconMap: Record<MacroBrainAlert["severity"], typeof AlertTriangle> = { critical: AlertTriangle, warning: TrendingUp, info: Zap };
    const Icon = IconMap[alert.severity];
    
    return (
        <GlassCard variant="dark" glow={colorMap[alert.severity]} className="p-4 flex gap-3">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-status-danger' : alert.severity === 'warning' ? 'text-action-primary' : 'text-status-info'}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{alert.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted shrink-0">{format(new Date(alert.timestamp), "dd/MM HH:mm")}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                {alert.suggestedAction && <p className="text-[9px] font-bold uppercase tracking-wider mt-2 opacity-70">→ {alert.suggestedAction}</p>}
            </div>
        </GlassCard>
    );
}

const EXAMPLE_ALERTS: MacroBrainAlert[] = [
    { id: "ex-1", title: "Pic de fréquentation prévu", message: "Les données des 4 dernières semaines indiquent un afflux de +35 % vendredi soir. Anticipez les stocks et le personnel.", severity: "info", suggestedAction: "Renforcer l'équipe en salle vendredi soir", timestamp: Date.now() - 3_600_000 },
    { id: "ex-2", title: "Stock critique — saumon frais", message: "Au rythme actuel, le seuil minimal sera atteint dans 48 h. Une commande fournisseur s'impose avant jeudi.", severity: "warning", suggestedAction: "Passer commande fournisseur avant jeudi", timestamp: Date.now() - 7_200_000 },
    { id: "ex-3", title: "Revenu manqué — liste d'attente inactive", message: "3 tables sont restées libres pendant le service du soir alors que 8 réservations étaient en liste d'attente.", severity: "critical", suggestedAction: "Activer la gestion de liste d'attente", timestamp: Date.now() - 10_800_000 },
];

// ── Page ─────────────────────────────────────────────────────────────────────

function AnalyticsPage() {
    const canSeeOracle = useTabAccess("analytics", "oracle");

    const {
        activeTab, setActiveTab,
        macroAlerts, attendance, complianceAlerts,
        todayCA, yesterdayCA, weekCA, prevWeekCA, monthCA, prevMonthCA,
        chartData, maxChartRevenue, top5Products,
        totalSeats, occupiedSeats, occupancyRate, avgCoversPerService,
    } = useAnalyticsPage();

    const fmt = (v: number) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-serif font-bold">Analytique &amp; Intelligence</h1>
                <p className="text-sm text-text-muted mt-1">Rentabilité, réputation, conformité et prédictions Oracle.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <KpiCard label="CA Aujourd'hui" value={fmt(todayCA)} change={percentChange(todayCA, yesterdayCA)} up={todayCA >= yesterdayCA} />
                <KpiCard label="CA Cette Semaine" value={fmt(weekCA)} change={percentChange(weekCA, prevWeekCA)} up={weekCA >= prevWeekCA} />
                <KpiCard label="CA Ce Mois" value={fmt(monthCA)} change={percentChange(monthCA, prevMonthCA)} up={monthCA >= prevMonthCA} />
            </div>

            <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto no-scrollbar pb-1">
                {([
                    { id: "profitability", label: "Rentabilité", icon: TrendingUp },
                    { id: "reputation", label: "Réputation", icon: Star },
                    { id: "compliance", label: "Conformité", icon: ShieldCheck },
                    { id: "oracle", label: "Oracle", icon: Brain },
                ] as const).filter(tab => {
                    if (tab.id === "oracle") return canSeeOracle;
                    return true;
                }).map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? "border-action-primary text-action-primary" : "border-transparent text-text-muted hover:text-text-primary"}`}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </nav>

            <main>
                {activeTab === "profitability" && <div className="space-y-8"><MenuEngineeringMatrix /><ProfitabilityView alerts={[]} /></div>}
                {activeTab === "reputation" && <ReputationView reviews={[]} />}
                {activeTab === "compliance" && <ComplianceView alerts={complianceAlerts} />}

                {activeTab === "oracle" && (
                    <TabGuard pageKey="analytics" tabKey="oracle">
                    <div className="space-y-10">
                        {/* 30-day chart */}
                        <section>
                            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4"><BarChart2 className="w-4 h-4" /> CA — 30 derniers jours</h2>
                            <div className="rounded-xl border border-border bg-surface-base p-4 overflow-x-auto">
                                <div className="flex items-end gap-[3px] min-w-[520px]" style={{ height: "140px" }}>
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex flex-col items-center flex-1 gap-1 group" title={`${d.fullLabel} : ${d.revenue.toLocaleString("fr-FR")} €`}>
                                            <div className="flex-1 w-full flex items-end">
                                                <div className="w-full rounded-t-sm bg-action-primary/30 group-hover:bg-action-primary transition-colors duration-150" style={{ height: `${Math.max((d.revenue / maxChartRevenue) * 100, 2)}%` }} />
                                            </div>
                                            {i % 5 === 0 && <span className="text-[7px] text-text-muted leading-none">{d.label}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Top 5 + Occupancy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section>
                                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4"><Package className="w-4 h-4" /> Top 5 Produits</h2>
                                <div className="rounded-xl border border-border bg-surface-base overflow-hidden">
                                    {top5Products.length === 0 ? (
                                        <p className="px-4 py-6 text-sm text-text-muted text-center">Aucune vente enregistrée.</p>
                                    ) : top5Products.map((p, i) => (
                                        <div key={p.name} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[10px] font-black text-text-muted w-4 shrink-0">{i + 1}</span>
                                                <span className="text-sm text-text-primary truncate">{p.name}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-action-primary shrink-0 ml-2">{p.count} ventes</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4"><Users className="w-4 h-4" /> Occupation &amp; Couverts</h2>
                                <div className="rounded-xl border border-border bg-surface-base p-5 space-y-5">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-text-muted">Taux d&apos;occupation</span>
                                            <span className="font-bold text-text-primary">{occupancyRate} %</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                                            <div className="h-full bg-action-primary rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
                                        </div>
                                        <p className="text-[10px] text-text-muted mt-1.5">{occupiedSeats} / {totalSeats} couverts actuellement</p>
                                    </div>
                                    <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                                        <span className="text-sm text-text-muted">Couverts moyens / service</span>
                                        <span className="text-sm font-bold text-text-primary">{avgCoversPerService}</span>
                                    </div>
                                    {attendance && (
                                        <div className="pt-3 border-t border-border/40">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Prévision prochain service</p>
                                            <p className="text-xs font-semibold text-text-secondary capitalize mb-1">{attendance.label}</p>
                                            <p className="text-sm text-text-primary">
                                                <span className="font-bold">{attendance.low}–{attendance.high}</span> couverts
                                                <span className="text-text-muted ml-2 text-xs">(médiane : {attendance.median})</span>
                                            </p>
                                            <p className="text-[9px] text-text-muted mt-1">Basé sur les 8 dernières semaines</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Insights IA */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted"><Lightbulb className="w-4 h-4" /> Insights IA</h2>
                                <button onClick={() => fetch("/api/admin/intelligence/vision", { method: "POST" })} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-action-primary hover:opacity-70 transition-opacity">
                                    <Zap className="w-3 h-3" /> Analyser maintenant
                                </button>
                            </div>
                            {macroAlerts.length === 0 ? (
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> Exemples d&apos;insights — lancez une analyse pour obtenir les vôtres</p>
                                    {EXAMPLE_ALERTS.map((alert) => (
                                        <div key={alert.id} className="relative">
                                            <span className="absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-widest bg-surface-base border border-border text-text-muted px-2 py-0.5 rounded-full">Exemple</span>
                                            <AlertCard alert={alert} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">{macroAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>
                            )}
                        </section>
                    </div>
                    </TabGuard>
                )}
            </main>
        </div>
    );
}

export default withPageGuard(AnalyticsPage, "analytics");
