"use client";

import { useMemo } from "react";
import { isToday, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import {
  TrendingUp,
  Users,
  Zap,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTables } from '../../../../ops/providers/hooks/floorHooks';
import { useOrders } from '../../../../ops/providers/hooks/kitchenHooks';
import { useInventory } from '../../../../logistics/stock/inventory/hooks/useInventory';
import { useAuth } from "@/shared/hooks";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { useIsMobile } from "@/shared/hooks";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { kpiContainerVariants, fadeInUp } from "@/shared/utils/motion";

import { LandingKpiCard } from "./dashboard/LandingKpiCard";
import { LandingSmartAlert } from "./dashboard/LandingSmartAlert";
import { LandingExecutiveHeader } from "./dashboard/LandingExecutiveHeader";
import { LandingTrendChart } from "./dashboard/LandingTrendChart";

export function LandingDashboard() {
  const router = useRouter();
  const { tables } = useTables();
  const { data: orders } = useOrders();
  const { lowStockItems } = useInventory();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  const showCA = usePageSetting('dashboard', 'show_ca', true);
  const dailyCATarget = usePageSetting('dashboard', 'ca_target', 5000);
  const dailyTicketsTarget = usePageSetting('dashboard', 'tickets_target', 100);
  const occupancyTarget = usePageSetting('dashboard', 'occupation_target', 85);

  // 100% DATA-DRIVEN KPIs from real Firestore data
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

  const activeTables = tables.filter((t) => ['seated', 'ordered', 'eating', 'paying'].includes(t.status)).length;
  const totalTables = tables.length;
  const serviceRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;
  const occupancyRate = serviceRate;
  const occupiedTables = activeTables;

  // Dynamic SVG chart from last 7 days of real data
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
      return {
        x: padding + (i / (dailyRevenues.length - 1 || 1)) * usableWidth,
        y: padding + usableHeight - (rev / maxRevenue) * usableHeight
      };
    });

    if (points.length < 2) return `M${padding},${height / 2} L${width - padding},${height / 2}`;
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

  // Dynamic alerts from real data
  const dynamicAlerts = useMemo(() => {
    const alerts: { type: string; title: string; message: string; action?: string; time: string; onAction?: () => void }[] = [];

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

    if (avgTicket > 0) {
      alerts.push({
        type: avgTicket >= 25 ? "success" : "warning",
        title: `Panier Moyen: ${avgTicket}€`,
        message: `Ticket moyen du jour sur ${todayTickets} commande(s). ${avgTicket >= 25 ? 'Excellente performance !' : 'Les suggestions POS peuvent améliorer ce chiffre.'}`,
        time: "LIVE"
      });
    }

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 md:space-y-16 px-4 md:px-8 max-w-7xl mx-auto pb-24 lg:pb-8"
    >
      <LandingExecutiveHeader
        userName={currentUser?.name?.split(' ')?.[0] || 'Invité'}
        isMobile={isMobile}
      />

      {/* KPI GRID */}
      <motion.div
        variants={kpiContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
      >
        {showCA && (
          <LandingKpiCard
            title="CHIFFRE D'AFFAIRES"
            value={`${todayRevenue.toLocaleString('fr-FR')}€`}
            trend={todayRevenue >= dailyCATarget ? "up" : "down"}
            trendValue={todayRevenue >= dailyCATarget ? "Objectif Atteint" : `${(dailyCATarget - todayRevenue).toLocaleString('fr-FR')}€ manquant`}
            icon={ShoppingBag}
            isMobile={isMobile}
          />
        )}
        <LandingKpiCard
          title="TICKETS"
          value={todayTickets}
          trend={todayTickets >= dailyTicketsTarget ? "up" : "down"}
          trendValue={`Panier moyen: ${avgTicket}€`}
          icon={TrendingUp}
          isMobile={isMobile}
        />
        <LandingKpiCard
          title="STOCK ALERTE"
          value={lowStockItems.length}
          trend={lowStockItems.length > 5 ? "down" : "up"}
          trendValue={lowStockItems.length > 5 ? "Action requise" : "Niveaux sains"}
          icon={Zap}
          isMobile={isMobile}
        />
        <LandingKpiCard
          title="OCCUPATION"
          value={`${occupancyRate}%`}
          trend={occupancyRate >= occupancyTarget ? "up" : "down"}
          trendValue={`${occupiedTables}/${totalTables} tables`}
          icon={Users}
          isMobile={isMobile}
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <LandingTrendChart chartPath={chartPath} isMobile={isMobile} />

        {/* Intelligence Alerts */}
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
              <LandingSmartAlert
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
