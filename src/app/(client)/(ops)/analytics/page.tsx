"use client";

import {
    TrendingUp, TrendingDown, Star, ShieldCheck, Brain, Package,
    Users, AlertTriangle, Zap, Lightbulb, ChevronRight, BarChart2,
} from "lucide-react";
import { format } from "date-fns";

import { useAnalyticsPage, percentChange, type MacroBrainAlert } from '@/modules/finance';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { useTabAccess } from "@/shared/hooks/useTabAccess";
import { PageShell } from "@/shared/components/ui/PageShell";
import {
    ProfitabilityView, ReputationView, ComplianceView, MenuEngineeringMatrix,
} from "@/modules/intelligence";

// ── Local sub-components (presentation only) ──────────────────────────────────

function KpiCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
    return (
        <div className="rounded-xl border border-border/60 bg-surface-base p-5 flex flex-col gap-2.5">
            <p className="font-serif italic text-[11px] uppercase tracking-[0.24em] text-text-muted/80">{label}</p>
            <p className="font-serif font-black text-3xl leading-none tracking-[-0.02em] text-text-primary tabular-nums">{value}</p>
            <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${up ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"}`}>
                {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </span>
        </div>
    );
}

function AlertCard({ alert }: { alert: MacroBrainAlert }) {
    const colorMap: Record<MacroBrainAlert["severity"], string> = {
        critical: "border-red-500/30 bg-status-danger/5 text-status-danger",
        warning: "border-yellow-500/30 bg-action-primary/5 text-yellow-400",
        info: "border-blue-500/30 bg-status-info/5 text-blue-400",
    };
    const IconMap: Record<MacroBrainAlert["severity"], typeof AlertTriangle> = { critical: AlertTriangle, warning: TrendingUp, info: Zap };
    const Icon = IconMap[alert.severity];
    return (
        <div className={`rounded-xl border p-4 flex gap-3 ${colorMap[alert.severity]}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-text-primary leading-tight tracking-tight">{alert.title}</p>
                    <span className="font-serif italic text-[11px] tracking-wide text-text-muted/80 shrink-0 tabular-nums">{format(new Date(alert.timestamp), "dd/MM HH:mm")}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{alert.message}</p>
                {alert.suggestedAction && <p className="text-xs font-medium mt-2.5 opacity-75">→ {alert.suggestedAction}</p>}
            </div>
        </div>
    );
}

// Section header standardisé — remplace text-[10px] font-black uppercase tracking-widest
function SectionHeader({ icon: Icon, children }: { icon: typeof AlertTriangle; children: React.ReactNode }) {
    return (
        <h2 className="flex items-center gap-2 text-xs font-medium tracking-tight text-text-secondary mb-4">
            <Icon className="w-[15px] h-[15px] text-accent-gold/70" strokeWidth={1.8} />
            <span>{children}</span>
        </h2>
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

    const analyticsTabs = ([
        { id: "profitability", label: "Rentabilité", icon: TrendingUp },
        { id: "reputation", label: "Réputation", icon: Star },
        { id: "compliance", label: "Conformité", icon: ShieldCheck },
        { id: "oracle", label: "Oracle", icon: Brain },
    ] as const).filter(tab => tab.id !== "oracle" || canSeeOracle);

    return (
        <PageShell
            kicker="Intelligence"
            title="Analytique & Intelligence"
            subtitle="Rentabilité, réputation, conformité et prédictions Oracle."
            icon={BarChart2}
            breadcrumbs={[{ label: "Opérations" }, { label: "Analytics" }]}
            tabs={
                <>
                    {analyticsTabs.map(({ id, label, icon: Icon }) => (
                        <PageShell.Tab
                            key={id}
                            active={activeTab === id}
                            onClick={() => setActiveTab(id)}
                            icon={Icon}
                        >
                            {label}
                        </PageShell.Tab>
                    ))}
                </>
            }
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <KpiCard label="CA Aujourd'hui" value={fmt(todayCA)} change={percentChange(todayCA, yesterdayCA)} up={todayCA >= yesterdayCA} />
                <KpiCard label="CA Cette Semaine" value={fmt(weekCA)} change={percentChange(weekCA, prevWeekCA)} up={weekCA >= prevWeekCA} />
                <KpiCard label="CA Ce Mois" value={fmt(monthCA)} change={percentChange(monthCA, prevMonthCA)} up={monthCA >= prevMonthCA} />
            </div>

            <main>
                {activeTab === "profitability" && <div className="space-y-8"><MenuEngineeringMatrix /><ProfitabilityView alerts={[]} /></div>}
                {activeTab === "reputation" && <ReputationView reviews={[]} />}
                {activeTab === "compliance" && <ComplianceView alerts={complianceAlerts} />}

                {activeTab === "oracle" && (
                    <TabGuard pageKey="analytics" tabKey="oracle">
                    <div className="space-y-10">
                        {/* 30-day chart */}
                        <section>
                            <SectionHeader icon={BarChart2}>CA — 30 derniers jours</SectionHeader>
                            <div className="rounded-xl border border-border/60 bg-surface-base p-4 overflow-x-auto">
                                <div className="flex items-end gap-[3px] min-w-[520px]" style={{ height: "140px" }}>
                                    {chartData.map((d: { label: string; fullLabel: string; revenue: number }, i: number) => (
                                        <div key={i} className="flex flex-col items-center flex-1 gap-1.5 group" title={`${d.fullLabel} : ${d.revenue.toLocaleString("fr-FR")} €`}>
                                            <div className="flex-1 w-full flex items-end">
                                                <div className="w-full rounded-t-sm bg-accent-gold/30 group-hover:bg-accent-gold transition-colors duration-150" style={{ height: `${Math.max((d.revenue / maxChartRevenue) * 100, 2)}%` }} />
                                            </div>
                                            {i % 5 === 0 && <span className="text-[10px] text-text-muted leading-none tabular-nums">{d.label}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Top 5 + Occupancy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section>
                                <SectionHeader icon={Package}>Top 5 Produits</SectionHeader>
                                <div className="rounded-xl border border-border/60 bg-surface-base overflow-hidden">
                                    {top5Products.length === 0 ? (
                                        <p className="px-4 py-6 text-sm text-text-muted text-center">Aucune vente enregistrée.</p>
                                    ) : top5Products.map((p: { name: string; count: number }, i: number) => (
                                        <div key={p.name} className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-b-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="font-serif font-black text-sm text-accent-gold/80 w-5 shrink-0 tabular-nums">{i + 1}</span>
                                                <span className="text-sm text-text-primary truncate">{p.name}</span>
                                            </div>
                                            <span className="text-xs font-medium text-text-secondary shrink-0 ml-2 tabular-nums">{p.count} ventes</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <SectionHeader icon={Users}>Occupation &amp; Couverts</SectionHeader>
                                <div className="rounded-xl border border-border/60 bg-surface-base p-5 space-y-5">
                                    <div>
                                        <div className="flex justify-between items-baseline text-sm mb-2">
                                            <span className="text-text-muted">Taux d&apos;occupation</span>
                                            <span className="font-serif font-black text-lg text-text-primary tabular-nums leading-none">{occupancyRate}<span className="text-xs text-text-muted ml-0.5">%</span></span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                                            <div className="h-full bg-accent-gold rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
                                        </div>
                                        <p className="text-xs text-text-muted mt-2 tabular-nums">{occupiedSeats} / {totalSeats} couverts actuellement</p>
                                    </div>
                                    <div className="pt-3 border-t border-border/40 flex justify-between items-baseline">
                                        <span className="text-sm text-text-muted">Couverts moyens / service</span>
                                        <span className="text-sm font-medium text-text-primary tabular-nums">{avgCoversPerService}</span>
                                    </div>
                                    {attendance && (
                                        <div className="pt-3 border-t border-border/40">
                                            <p className="font-serif italic text-[11px] uppercase tracking-[0.24em] text-text-muted/80 mb-2">Prévision prochain service</p>
                                            <p className="text-xs font-medium text-text-secondary capitalize mb-1">{attendance.label}</p>
                                            <p className="text-sm text-text-primary tabular-nums">
                                                <span className="font-serif font-black">{attendance.low}–{attendance.high}</span> couverts
                                                <span className="text-text-muted ml-2 text-xs">(médiane : {attendance.median})</span>
                                            </p>
                                            <p className="text-xs text-text-muted mt-1.5">Basé sur les 8 dernières semaines</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Insights IA */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <SectionHeader icon={Lightbulb}>Insights IA</SectionHeader>
                                <button onClick={() => fetch("/api/admin/intelligence/vision", { method: "POST" })} className="flex items-center gap-1.5 text-xs font-medium tracking-tight text-accent-gold hover:opacity-70 transition-opacity -mt-4">
                                    <Zap className="w-[14px] h-[14px]" /> Analyser maintenant
                                </button>
                            </div>
                            {macroAlerts.length === 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-text-muted mb-3 flex items-center gap-1.5 italic">
                                        <ChevronRight className="w-3 h-3" /> Exemples d&apos;insights — lancez une analyse pour obtenir les vôtres
                                    </p>
                                    {EXAMPLE_ALERTS.map((alert) => (
                                        <div key={alert.id} className="relative">
                                            <span className="absolute top-2 right-2 z-10 font-serif italic text-[10px] uppercase tracking-[0.2em] bg-surface-base border border-border/60 text-text-muted/80 px-2 py-0.5 rounded-full">Exemple</span>
                                            <AlertCard alert={alert} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">{macroAlerts.map((alert: MacroBrainAlert) => <AlertCard key={alert.id} alert={alert} />)}</div>
                            )}
                        </section>
                    </div>
                    </TabGuard>
                )}
            </main>
        </PageShell>
    );
}

export default withPageGuard(AnalyticsPage, "analytics");
