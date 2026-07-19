"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Star,
  ShieldCheck,
  Brain,
  Package,
  Users,
  AlertTriangle,
  Zap,
  Lightbulb,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";

import {
  ProfitabilityView,
  ReputationView,
  ComplianceView,
} from "@modules/intelligence/analytics/components";
import { useQuality } from "@modules/compliance";
import type { ComplianceAlert } from "@modules/intelligence/analytics/types";
import {
  useOrders,
  useTables,
} from "@/engines/ops/NexusOpsProvider";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { predictAttendance } from "@/modules/intelligence/attendance/AttendancePrediction";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AnalyticsTab = "profitability" | "reputation" | "compliance" | "oracle";

interface MacroBrainAlert {
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (pure, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

function revenueForRange(
  orders: OrderLike[],
  start: Date,
  end: Date
): number {
  return SovereignMath.fromMicrounits(
    orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d >= start &&
          d <= end &&
          (o.status === "paid" || o.status === "delivered")
        );
      })
      .reduce(
        (acc, o) =>
          SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o)),
        0
      )
  );
}

function percentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+∞ %" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct} %` : `${pct} %`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

function KpiCard({ label, value, change, up }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-base p-4 flex flex-col gap-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <p className="text-2xl font-light tracking-tight text-text-primary">
        {value}
      </p>
      <span
        className={`inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[9px] font-bold ${
          up
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        }`}
      >
        {up ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {change}
      </span>
    </div>
  );
}

interface AlertCardProps {
  alert: MacroBrainAlert;
}

function AlertCard({ alert }: AlertCardProps) {
  const colorMap: Record<MacroBrainAlert["severity"], string> = {
    critical: "border-red-500/30 bg-red-500/5 text-red-400",
    warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  };
  const IconMap: Record<MacroBrainAlert["severity"], typeof AlertTriangle> = {
    critical: AlertTriangle,
    warning: TrendingUp,
    info: Zap,
  };
  const Icon = IconMap[alert.severity];

  return (
    <div className={`rounded-xl border p-4 flex gap-3 ${colorMap[alert.severity]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-text-primary leading-tight">
            {alert.title}
          </p>
          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted shrink-0">
            {format(new Date(alert.timestamp), "dd/MM HH:mm")}
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {alert.message}
        </p>
        {alert.suggestedAction && (
          <p className="text-[9px] font-bold uppercase tracking-wider mt-2 opacity-70">
            → {alert.suggestedAction}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Example alerts (shown when the collection is empty)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_ALERTS: MacroBrainAlert[] = [
  {
    id: "ex-1",
    title: "Pic de fréquentation prévu",
    message:
      "Les données des 4 dernières semaines indiquent un afflux de +35 % vendredi soir. Anticipez les stocks et le personnel.",
    severity: "info",
    suggestedAction: "Renforcer l'équipe en salle vendredi soir",
    timestamp: Date.now() - 3_600_000,
  },
  {
    id: "ex-2",
    title: "Stock critique — saumon frais",
    message:
      "Au rythme actuel, le seuil minimal sera atteint dans 48 h. Une commande fournisseur s'impose avant jeudi.",
    severity: "warning",
    suggestedAction: "Passer commande fournisseur avant jeudi",
    timestamp: Date.now() - 7_200_000,
  },
  {
    id: "ex-3",
    title: "Revenu manqué — liste d'attente inactive",
    message:
      "3 tables sont restées libres pendant le service du soir alors que 8 réservations étaient en liste d'attente.",
    severity: "critical",
    suggestedAction: "Activer la gestion de liste d'attente",
    timestamp: Date.now() - 10_800_000,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
const _tabParam = searchParams.get("tab") as AnalyticsTab | null;
const _VALID_ANALYTICS_TABS: AnalyticsTab[] = ["profitability", "reputation", "compliance", "oracle"];
const [activeTab, setActiveTab] = useState<AnalyticsTab>(
    _tabParam && _VALID_ANALYTICS_TABS.includes(_tabParam) ? _tabParam : "profitability"
);
  const [macroAlerts, setMacroAlerts] = useState<MacroBrainAlert[]>([]);
  const [attendance, setAttendance] = useState<{
    low: number;
    median: number;
    high: number;
    label: string;
  } | null>(null);

  // ── Existing data sources ────────────────────────────────────────────────
  const { alerts: qualityAlerts } = useQuality();
  const { data: orders } = useOrders();
  const { tables } = useTables();

  const complianceAlerts = useMemo<ComplianceAlert[]>(
    () =>
      qualityAlerts.map((c) => ({
        id: c.id,
        userName: c.controller_name ?? c.supplier_name ?? c.id,
        message: `Contrôle ${c.control_number ?? c.id} — ${
          c.summary?.overall_status ?? "non-conforme"
        }`,
      })),
    [qualityAlerts]
  );

  // ── KPI: CA aujourd'hui ──────────────────────────────────────────────────
  const todayCA = useMemo(() => {
    const now = new Date();
    return revenueForRange(orders, startOfDay(now), now);
  }, [orders]);

  const yesterdayCA = useMemo(() => {
    const now = new Date();
    const todayMidnight = startOfDay(now);
    return revenueForRange(
      orders,
      startOfDay(subDays(now, 1)),
      new Date(todayMidnight.getTime() - 1)
    );
  }, [orders]);

  // ── KPI: CA cette semaine ────────────────────────────────────────────────
  const weekCA = useMemo(() => {
    const now = new Date();
    return revenueForRange(orders, startOfWeek(now, { weekStartsOn: 1 }), now);
  }, [orders]);

  const prevWeekCA = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const prevStart = subWeeks(weekStart, 1);
    return revenueForRange(
      orders,
      prevStart,
      new Date(weekStart.getTime() - 1)
    );
  }, [orders]);

  // ── KPI: CA ce mois ─────────────────────────────────────────────────────
  const monthCA = useMemo(() => {
    const now = new Date();
    return revenueForRange(orders, startOfMonth(now), now);
  }, [orders]);

  const prevMonthCA = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    return revenueForRange(
      orders,
      prevStart,
      new Date(thisMonthStart.getTime() - 1)
    );
  }, [orders]);

  // ── 30-day bar chart ─────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
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

  const maxChartRevenue = useMemo(
    () => Math.max(...chartData.map((d) => d.revenue), 1),
    [chartData]
  );

  // ── Top 5 products ───────────────────────────────────────────────────────
  const top5Products = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const o of orders) {
      if (o.status !== "paid" && o.status !== "delivered") continue;
      for (const item of o.items ?? []) {
        const prev = counts.get(item.productId);
        if (prev) {
          prev.count += item.quantity;
        } else {
          counts.set(item.productId, { name: item.name, count: item.quantity });
        }
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // ── Occupancy & covers ───────────────────────────────────────────────────
  const { totalSeats, occupiedSeats, occupancyRate, avgCoversPerService } =
    useMemo(() => {
      const activeStatuses = new Set([
        "seated",
        "ordered",
        "eating",
        "paying",
        "occupied",
      ]);
      const total = tables.reduce((acc, t) => acc + (t.seats ?? 0), 0);
      const occupied = tables
        .filter((t) => activeStatuses.has(t.status))
        .reduce((acc, t) => acc + (t.seats ?? 0), 0);
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

      const paidOrders = orders.filter(
        (o) => o.status === "paid" || o.status === "delivered"
      );
      const totalCoversSum = paidOrders.reduce(
        (acc, o) => acc + (o.covers ?? 0),
        0
      );
      const avg =
        paidOrders.length > 0
          ? Math.round(totalCoversSum / paidOrders.length)
          : 0;

      return {
        totalSeats: total,
        occupiedSeats: occupied,
        occupancyRate: rate,
        avgCoversPerService: avg,
      };
    }, [tables, orders]);

  // ── MacroBrain alerts (async Nexus query) ────────────────────────────────
  useEffect(() => {
    const tenantId = Nexus.activeTenant;
    const path = tenantId
      ? `tenants/${tenantId}/macrobrain_alerts`
      : "macrobrain_alerts";

    Nexus.adapter
      .query<MacroBrainAlert>(path, {
        orderBy: { field: "timestamp", direction: "desc" },
        limit: 5,
      })
      .then(setMacroAlerts)
      .catch(() => setMacroAlerts([]));
  }, []);

  // ── Attendance prediction (async) ────────────────────────────────────────
  useEffect(() => {
    const tenantId = Nexus.activeTenant ?? undefined;
    const now = new Date();
    const hour = now.getHours();

    let targetDate: Date;
    let serviceLabel: string;

    if (hour < 12) {
      targetDate = now;
      serviceLabel = `${format(now, "EEEE", { locale: fr })} déjeuner`;
    } else if (hour < 22) {
      targetDate = now;
      serviceLabel = `${format(now, "EEEE", { locale: fr })} dîner`;
    } else {
      targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      serviceLabel = `${format(targetDate, "EEEE", { locale: fr })} déjeuner`;
    }

    predictAttendance(targetDate.getTime(), tenantId)
      .then((result) => setAttendance({ ...result, label: serviceLabel }))
      .catch(() => setAttendance(null));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-2xl font-serif font-bold">
          Analytique &amp; Intelligence
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Rentabilité, réputation, conformité et prédictions Oracle.
        </p>
      </header>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="CA Aujourd'hui"
          value={`${todayCA.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} €`}
          change={percentChange(todayCA, yesterdayCA)}
          up={todayCA >= yesterdayCA}
        />
        <KpiCard
          label="CA Cette Semaine"
          value={`${weekCA.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} €`}
          change={percentChange(weekCA, prevWeekCA)}
          up={weekCA >= prevWeekCA}
        />
        <KpiCard
          label="CA Ce Mois"
          value={`${monthCA.toLocaleString("fr-FR", {
            maximumFractionDigits: 2,
          })} €`}
          change={percentChange(monthCA, prevMonthCA)}
          up={monthCA >= prevMonthCA}
        />
      </div>

      {/* ── Tab nav ── */}
      <nav className="flex gap-1 border-b border-border mb-6">
        {(
          [
            { id: "profitability", label: "Rentabilité", icon: TrendingUp },
            { id: "reputation", label: "Réputation", icon: Star },
            { id: "compliance", label: "Conformité", icon: ShieldCheck },
            { id: "oracle", label: "Oracle", icon: Brain },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-action-primary text-action-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── Tab content ── */}
      <main>
        {activeTab === "profitability" && <ProfitabilityView alerts={[]} />}
        {activeTab === "reputation" && <ReputationView reviews={[]} />}
        {activeTab === "compliance" && (
          <ComplianceView alerts={complianceAlerts} />
        )}

        {activeTab === "oracle" && (
          <div className="space-y-10">

            {/* ── 30-day CA bar chart ── */}
            <section>
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
                <BarChart2 className="w-4 h-4" />
                CA — 30 derniers jours
              </h2>
              <div className="rounded-xl border border-border bg-surface-base p-4 overflow-x-auto">
                <div
                  className="flex items-end gap-[3px] min-w-[520px]"
                  style={{ height: "140px" }}
                >
                  {chartData.map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center flex-1 gap-1 group"
                      title={`${d.fullLabel} : ${d.revenue.toLocaleString(
                        "fr-FR"
                      )} €`}
                    >
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-sm bg-action-primary/30 group-hover:bg-action-primary transition-colors duration-150"
                          style={{
                            height: `${Math.max(
                              (d.revenue / maxChartRevenue) * 100,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                      {i % 5 === 0 && (
                        <span className="text-[7px] text-text-muted leading-none">
                          {d.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Top 5 products + Occupancy ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Top 5 products */}
              <section>
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
                  <Package className="w-4 h-4" />
                  Top 5 Produits
                </h2>
                <div className="rounded-xl border border-border bg-surface-base overflow-hidden">
                  {top5Products.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-text-muted text-center">
                      Aucune vente enregistrée.
                    </p>
                  ) : (
                    top5Products.map((p, i) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-black text-text-muted w-4 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-text-primary truncate">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-action-primary shrink-0 ml-2">
                          {p.count} ventes
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Occupancy & covers */}
              <section>
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
                  <Users className="w-4 h-4" />
                  Occupation &amp; Couverts
                </h2>
                <div className="rounded-xl border border-border bg-surface-base p-5 space-y-5">
                  {/* Occupancy bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-muted">Taux d&apos;occupation</span>
                      <span className="font-bold text-text-primary">
                        {occupancyRate} %
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-action-primary rounded-full transition-all duration-500"
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5">
                      {occupiedSeats} / {totalSeats} couverts actuellement
                    </p>
                  </div>

                  {/* Avg covers */}
                  <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                    <span className="text-sm text-text-muted">
                      Couverts moyens / service
                    </span>
                    <span className="text-sm font-bold text-text-primary">
                      {avgCoversPerService}
                    </span>
                  </div>

                  {/* Attendance prediction */}
                  {attendance && (
                    <div className="pt-3 border-t border-border/40">
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">
                        Prévision prochain service
                      </p>
                      <p className="text-xs font-semibold text-text-secondary capitalize mb-1">
                        {attendance.label}
                      </p>
                      <p className="text-sm text-text-primary">
                        <span className="font-bold">
                          {attendance.low}–{attendance.high}
                        </span>{" "}
                        couverts
                        <span className="text-text-muted ml-2 text-xs">
                          (médiane : {attendance.median})
                        </span>
                      </p>
                      <p className="text-[9px] text-text-muted mt-1">
                        Basé sur les 8 dernières semaines
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ── Insights IA (MacroBrain alerts) ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                  <Lightbulb className="w-4 h-4" />
                  Insights IA
                </h2>
                <button
                  onClick={() =>
                    fetch("/api/admin/intelligence/vision", { method: "POST" })
                  }
                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-action-primary hover:opacity-70 transition-opacity"
                >
                  <Zap className="w-3 h-3" />
                  Analyser maintenant
                </button>
              </div>

              {macroAlerts.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" />
                    Exemples d&apos;insights — lancez une analyse pour obtenir les vôtres
                  </p>
                  {EXAMPLE_ALERTS.map((alert) => (
                    <div key={alert.id} className="relative">
                      <span className="absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-widest bg-surface-base border border-border text-text-muted px-2 py-0.5 rounded-full">
                        Exemple
                      </span>
                      <AlertCard alert={alert} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {macroAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
