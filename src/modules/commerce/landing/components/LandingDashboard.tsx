"use client";

import { useMemo } from "react";
import { format, isToday, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import {
  TrendingUp,
  Users,
  Calendar,
  Zap,
  ShoppingBag,
  Plus,
  Package,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTables } from "@/modules/ops/providers/NexusOpsProvider";
import { useOrders } from "@/modules/ops/providers/NexusOpsProvider";
import { useInventory } from "@/modules/ops/providers/NexusOpsProvider";
import { useAuth } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";;
import { useToast } from "@ui/Toast";
import { useLanguage } from "@/shared/hooks";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { useIsMobile } from "@/shared/hooks";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { kpiContainerVariants, kpiCardVariants, fadeInUp } from "@/shared/utils/motion";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
  icon: import('lucide-react').LucideIcon;
  delay?: number;
  tutorialId?: string;
  isMobile?: boolean;
}

const KpiCard = ({ title, value, trend, trendValue, icon: Icon, delay: _delay = 0, tutorialId, isMobile }: KpiCardProps) => (
  <motion.div
    variants={kpiCardVariants}
    data-tutorial={tutorialId}
    whileHover={!isMobile ? {
      y: -4,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    } : {}}
    className={cn(
      "group cursor-pointer card-premium",
      isMobile ? "p-4 min-h-[110px]" : "p-6 md:p-8 min-h-[140px]"
    )}
  >
    <div className="flex flex-col gap-3 md:gap-4 h-full justify-between">
      <div className="flex items-center justify-between">
        <p className="text-[8px] md:text-[10px] font-black text-accent-gold uppercase tracking-[0.25em]">{title}</p>
        <div className="p-1.5 rounded-full bg-bg-tertiary/50 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
          <Icon strokeWidth={1} className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 md:gap-3">
          <h3 className={cn(
            "font-sans font-light text-text-primary tracking-tight",
            isMobile ? "text-2xl" : "text-4xl"
          )}>
            {value}
          </h3>
          <div className={cn(
            "text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            trend === "up" ? "bg-success-soft text-success" : "bg-error-soft text-error"
          )}>
            {trend === "up" ? "↑" : "↓"}
          </div>
        </div>
        <p className="text-[8px] md:text-[10px] text-text-muted font-medium italic mt-1 md:mt-2 truncate">
          {trendValue}
        </p>
      </div>
    </div>
  </motion.div>
);

interface SmartAlertProps {
  type: string;
  title: string;
  message: string;
  action?: string;
  time: string;
  onAction?: () => void;
  index: number;
  isMobile?: boolean;
}

const SmartAlert = ({ type, title, message, action, time, onAction, index, isMobile }: SmartAlertProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
    className={cn(
      "border-b border-border/50 group cursor-pointer",
      isMobile ? "py-4" : "py-6"
    )}
  >
    <div className="flex gap-4 md:gap-6 items-start">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
        type === "critical" ? "bg-error" : type === "warning" ? "bg-warning" : "bg-success"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1 md:mb-2">
          <h4 className="text-[14px] md:text-[15px] font-serif font-semibold text-text-primary truncate">{title}</h4>
          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest shrink-0 ml-4">{time}</span>
        </div>
        <p className="text-[12px] md:text-[13px] text-text-secondary leading-relaxed mb-3 font-sans font-light">
          {message}
        </p>
        {action && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction?.(); }}
            className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-gold flex items-center gap-2"
          >
            {action}
            <div className="w-6 h-[1px] bg-accent-gold/30 group-hover:w-10 group-hover:bg-accent transition-all duration-300" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export function LandingDashboard() {
  const router = useRouter();
  const { tables } = useTables();
  const { data: orders } = useOrders();
  const _totalRevenue = orders.reduce((acc, o) => {
    return SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o));
  }, 0);
  const { lowStockItems } = useInventory();
  const { currentUser } = useAuth();
  const { showToast: _showToast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const showCA = usePageSetting('dashboard', 'show_ca', true);
  const _showStaffMetrics = usePageSetting('dashboard', 'show_staff_metrics', true);
  const _showWeatherWidget = usePageSetting('dashboard', 'show_weather_widget', true);
  const dailyCATarget = usePageSetting('dashboard', 'ca_target', 5000);
  const dailyTicketsTarget = usePageSetting('dashboard', 'tickets_target', 100);
  const occupancyTarget = usePageSetting('dashboard', 'occupation_target', 85);

  // C3 FIX: 100% DATA-DRIVEN KPIs from real Firestore data
  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return isToday(orderDate);
    });
  }, [orders]);

  const todayRevenue = useMemo(() => {
    const revenueInMicrounits = todayOrders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .reduce((acc, o) => {
        return SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o));
      }, 0);
    return SovereignMath.fromMicrounits(revenueInMicrounits);
  }, [todayOrders]);

  const todayTickets = useMemo(() => todayOrders.length, [todayOrders]);

  const avgTicket = useMemo(() => {
    const paidOrders = todayOrders.filter(o => o.status === 'paid' || o.status === 'delivered');
    if (paidOrders.length === 0) return 0;
    
    const totalInMicrounits = paidOrders.reduce((acc, o) => {
      return SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o));
    }, 0);
    
    const averageInMicrounits = SovereignMath.divide(totalInMicrounits, paidOrders.length);
    return Math.round(SovereignMath.fromMicrounits(averageInMicrounits));
  }, [todayOrders]);

  // C3 FIX: Real service activity from tables
  const activeTables = tables.filter((t) => ['seated', 'ordered', 'eating', 'paying'].includes(t.status)).length;
  const totalTables = tables.length;
  const serviceRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;
  const occupancyRate = serviceRate;
  const occupiedTables = activeTables;

  // C3 FIX: Dynamic SVG chart from last 7 days of real data
  const chartPath = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const dailyRevenues = last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return startOfDay(orderDate).getTime() === dayStart.getTime()
          && (o.status === 'paid' || o.status === 'delivered');
      });
      const dayRevenueInMicrounits = dayOrders.reduce((acc, o) => {
          return SovereignMath.add(acc, SovereignMath.orderTotalMicrounits(o));
      }, 0);
      return SovereignMath.fromMicrounits(dayRevenueInMicrounits);
    });

    const maxRevenue = Math.max(...dailyRevenues, 1);
    const width = 800;
    const height = 300;
    const padding = 20;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const points = dailyRevenues.map((rev, i) => {
      // Direct division here is okay for SVG scaling (floating point space) 
      // but the source 'rev' is now derived from SovereignMath.
      return {
        x: padding + (i / (dailyRevenues.length - 1 || 1)) * usableWidth,
        y: padding + usableHeight - (rev / maxRevenue) * usableHeight
      };
    });

    if (points.length < 2) return `M${padding},${height / 2} L${width - padding},${height / 2}`;

    // Generate smooth cubic bezier curve
    if (!points[0]) return "";
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
      path += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
    }
    return path;
  }, [orders]);

  // C3 FIX: Dynamic alerts from real data
  const dynamicAlerts = useMemo(() => {
    const alerts: { type: string; title: string; message: string; action?: string; time: string; onAction?: () => void }[] = [];

    // Alert 1: Low stock items
    if (lowStockItems && lowStockItems.length > 0) {
      const topLowItem = lowStockItems[0];
      alerts.push({
        type: "error",
        title: `Rupture Proche — ${topLowItem.name}`,
        message: `${lowStockItems.length} ingrédient(s) en alerte de stock bas. ${topLowItem.name} est en dessous du seuil minimum.`,
        action: "Commander",
        time: "MAINTENANT",
        onAction: () => router.push('/inventory')
      });
    }

    // Alert 2: Revenue target tracking
    const revenueProgress = dailyCATarget > 0 ? Math.round((todayRevenue / dailyCATarget) * 100) : 0;
    if (todayRevenue >= dailyCATarget) {
      alerts.push({
        type: "success",
        title: "Objectif CA Atteint!",
        message: `Le chiffre d'affaires du jour (${todayRevenue.toLocaleString('fr-FR')}€) a dépassé l'objectif de ${dailyCATarget.toLocaleString('fr-FR')}€. Bravo à l'équipe!`,
        time: "AUJOURD'HUI"
      });
    } else if (revenueProgress > 0) {
      alerts.push({
        type: "warning",
        title: "Objectif CA en cours",
        message: `${revenueProgress}% de l'objectif atteint (${todayRevenue.toLocaleString('fr-FR')}€ / ${dailyCATarget.toLocaleString('fr-FR')}€). ${(dailyCATarget - todayRevenue).toLocaleString('fr-FR')}€ restant.`,
        action: "Voir Analytique",
        time: `${revenueProgress}%`,
        onAction: () => router.push('/analytics')
      });
    }

    // Alert 3: Ticket moyen
    if (avgTicket > 0) {
      alerts.push({
        type: avgTicket >= 25 ? "success" : "warning",
        title: `Panier Moyen: ${avgTicket}€`,
        message: `Ticket moyen du jour sur ${todayTickets} commande(s). ${avgTicket >= 25 ? 'Excellente performance !' : 'Les suggestions POS peuvent améliorer ce chiffre.'}`,
        time: "LIVE"
      });
    }

    // Fallback if no data
    if (alerts.length === 0) {
      alerts.push({
        type: "success",
        title: "Système Opérationnel",
        message: "Aucune alerte active. Tous les indicateurs sont nominaux.",
        time: "MAINTENANT"
      });
    }

    return alerts;
  }, [lowStockItems, todayRevenue, avgTicket, todayTickets, dailyCATarget, router]);

  const quickActions = [
    { label: t('dashboard.actions.new_order'), icon: Plus, href: "/pos", primary: true },
    { label: t('dashboard.actions.reservation'), icon: Calendar, href: "/reservations" },
    { label: t('dashboard.actions.inventory'), icon: Package, href: "/inventory" },
    { label: t('dashboard.actions.analytics'), icon: BarChart3, href: "/analytics" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 md:space-y-16 px-4 md:px-8 max-w-7xl mx-auto pb-24 lg:pb-8"
    >
      {/* Executive Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 md:pt-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2 md:space-y-6">
          <div className="flex items-center gap-3 text-accent-gold text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="w-6 md:w-12 h-[1px] bg-accent-gold/30" />
            {format(new Date(), "EEEE d MMMM", { locale: fr })} • {new Date().getHours() < 16 ? "MIDI" : "SOIR"}
          </div>

          <h2 className="text-4xl md:text-7xl font-serif font-light text-text-primary tracking-tight leading-[1.1]">
            {t('dashboard.hello')}, <br />
            <span className="italic">{currentUser?.name?.split(' ')?.[0] || 'Invité'}</span>
          </h2>
        </div>

        {!isMobile && (
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{t('dashboard.status')}</p>
              <p className="text-[13px] font-serif italic text-accent">{t('dashboard.status_text')}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions Scroll */}
      <div className="flex gap-4 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0 md:flex-wrap">
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 cursor-pointer group shrink-0"
            >
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                action.primary ? "bg-accent-gold text-white shadow-lg shadow-accent-gold/20" : "bg-bg-secondary border border-border"
              )}>
                <action.icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* KPI GRID - 100% Real Data */}
      <motion.div
        variants={kpiContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
      >
        {showCA && (
          <KpiCard
            title="CHIFFRE D'AFFAIRES"
            value={`${todayRevenue.toLocaleString('fr-FR')}€`}
            trend={todayRevenue >= dailyCATarget ? "up" : "down"}
            trendValue={todayRevenue >= dailyCATarget ? "Objectif Atteint" : `${(dailyCATarget - todayRevenue).toLocaleString('fr-FR')}€ manquant`}
            icon={ShoppingBag}
            isMobile={isMobile}
          />
        )}
        <KpiCard
          title="TICKETS"
          value={todayTickets}
          trend={todayTickets >= dailyTicketsTarget ? "up" : "down"}
          trendValue={`Panier moyen: ${avgTicket}€`}
          icon={TrendingUp}
          isMobile={isMobile}
        />
        <KpiCard
          title="STOCK ALERTE"
          value={lowStockItems.length}
          trend={lowStockItems.length > 5 ? "down" : "up"}
          trendValue={lowStockItems.length > 5 ? "Action requise" : "Niveaux sains"}
          icon={Zap}
          isMobile={isMobile}
        />
        <KpiCard
          title="OCCUPATION"
          value={`${occupancyRate}%`}
          trend={occupancyRate >= occupancyTarget ? "up" : "down"}
          trendValue={`${occupiedTables}/${totalTables} tables`}
          icon={Users}
          isMobile={isMobile}
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Charts Container - Dynamic SVG */}
        <motion.div
          variants={fadeInUp}
          className="xl:col-span-2 card-premium p-6 md:p-10"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-light text-text-primary tracking-tight">Tendance CA — 7 Jours</h3>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-black">Données Réelles • Firestore</p>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-gold" />
                  <span className="text-[9px] font-black text-accent-gold uppercase">CA Journalier</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[200px] md:h-[300px] w-full relative">
            <svg viewBox="0 0 800 300" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-gold)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--color-accent-gold)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d={chartPath}
                fill="transparent"
                stroke="var(--color-accent-gold)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2 }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Intelligence Alerts - Dynamic */}
        <motion.div
          variants={fadeInUp}
          className="card-premium p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6 border-b border-border/30 pb-4">
            <h3 className="text-xl font-serif font-light text-text-primary">Oracle Intelligence</h3>
            <span className="text-[9px] font-black text-accent-gold uppercase bg-bg-tertiary px-2 py-1 rounded-full">
              {String(dynamicAlerts.length).padStart(2, '0')} ALERTES
            </span>
          </div>

          <div className="space-y-2">
            {dynamicAlerts.map((alert, index) => (
              <SmartAlert
                key={index}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                action={alert.action}
                time={alert.time}
                index={index}
                isMobile={isMobile}
                onAction={alert.onAction}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
