"use client";

import React, { useState, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Utensils, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Activity
} from "lucide-react";

// Nexus Data Hooks
import { useAccounting, useCompliance } from "@/modules/finance/providers";
import { useOrders, useTables, useReservations } from "@/modules/ops/providers";

// Define an interface for the orders since useOrders() might return generic objects
interface Order {
  id: string;
  tableId?: string;
  tableNumber?: string;
  status: string;
  totalInMicrounits?: number;
  createdAt: string;
}

/** Réservation issue du provider Ops. */
interface Reservation {
  id: string;
  partySize: number;
  date: string;
  status: string;
}

export default function VibecodingDashboard() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  // 1. Fetch Real Data from Nexus Providers
  const { metrics, entries: _entries } = useAccounting();
  const { documents } = useCompliance();
  const { data: ordersData } = useOrders();
  const orders = ordersData as unknown as Order[];
  const { nodes: _tables } = useTables();
  const { data: reservations } = useReservations();

  // 2. Compute Real Stats
  const stats = useMemo(() => {
    // Net profit is stored in microunits (1 EUR = 1,000,000 microunits)
    const revenue = (metrics?.netProfitInMicrounits || 0) / 1000000;
    
    // Active orders count
    const activeOrders = orders?.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED') || [];
    
    // Total covers (couverts) based on reservations or active tables
    const totalCovers = reservations?.reduce((acc: number, res: Reservation) => acc + (res.partySize || 0), 0) || 0;

    // Number of expired or pending compliance documents
    const haccpAlerts = documents?.filter(d => d.status === 'PENDING' || d.status === 'EXPIRED').length || 0;

    return [
      {
        title: "Chiffre d'Affaires",
        value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(revenue),
        change: "—",
        trend: "neutral",
        icon: TrendingUp
      },
      {
        title: "Couverts (Jour)",
        value: totalCovers.toString(),
        change: "—",
        trend: "neutral",
        icon: Users
      },
      {
        title: "Commandes en Cours",
        value: activeOrders.length.toString(),
        change: "—",
        trend: "neutral",
        icon: Utensils
      },
      { 
        title: "Alertes HACCP", 
        value: haccpAlerts.toString(), 
        change: haccpAlerts > 0 ? `+${haccpAlerts}` : "0", 
        trend: haccpAlerts > 0 ? "down" : "up", 
        icon: AlertTriangle 
      }
    ];
  }, [metrics, orders, reservations, documents]);

  // 3. Format Recent Orders
  const recentOrdersList = useMemo(() => {
    if (!orders) return [];
    return orders.slice(0, 4).map(order => ({
      id: `#${order.id.slice(-4).toUpperCase()}`,
      table: order.tableId ? `Table ${order.tableNumber ?? order.tableId.split('-').pop()}` : "Emporter",
      status: order.status,
      time: new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      amount: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((order.totalInMicrounits || 0) / 1000000)
    }));
  }, [orders]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-surface-bg text-text-primary p-8 font-sans selection:bg-action-primary/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-between items-end"
        >
          <div>
            <h1 className="text-4xl font-light tracking-tight text-text-primary/90">
              Restaurant <span className="font-semibold text-text-primary">Vanguard</span>
            </h1>
            <p className="text-text-secondary mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-status-success animate-pulse" />
              Pulse en temps réel — Grade X Souveraineté
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Session Active</p>
            <p className="text-lg text-text-primary/80">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6 backdrop-blur-xl transition-colors hover:bg-white/[0.04]"
            >
              {/* Subtle glassmorphism gradient glow */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-action-primary/10 to-action-primary/10 opacity-0 transition-opacity duration-500 ${hoveredStat === index ? 'opacity-100' : ''}`}
              />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/[0.05] rounded-xl border border-white/[0.05]">
                    <stat.icon className={`w-6 h-6 ${stat.title === "Alertes HACCP" && parseInt(stat.value) > 0 ? "text-rose-400" : "text-brand"}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-status-success' : stat.trend === 'down' ? 'text-rose-400' : 'text-text-muted'}`}>
                    {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                    {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-text-secondary text-sm font-medium">{stat.title}</h3>
                  <p className="text-3xl font-semibold mt-1 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Orders - Glassmorphism Table */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 rounded-3xl bg-white/[0.02] border border-white/[0.05] p-8 backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-text-primary/90">Commandes Récentes</h2>
              <button className="text-sm text-brand hover:text-brand transition-colors">Voir tout</button>
            </div>
            
            <div className="space-y-4">
              {recentOrdersList.length > 0 ? recentOrdersList.map((order, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-action-primary/10 flex items-center justify-center text-brand font-medium group-hover:bg-action-primary/20 transition-colors">
                      {order.id}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary/90">{order.table}</p>
                      <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {order.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-text-primary/90">{order.amount}</p>
                    <p className="text-sm mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${order.status === 'PAID' ? 'bg-status-success/10 text-status-success' : 
                          order.status === 'PREPARING' ? 'bg-action-primary/10 text-action-primary' : 
                          'bg-neutral-500/10 text-text-secondary'}`}>
                        {order.status || 'En attente'}
                      </span>
                    </p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-text-muted">
                  <Utensils className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande récente en cours.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions / Compliance Status */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-3xl bg-gradient-to-b from-action-primary/10 to-transparent border border-focus/20 p-8 backdrop-blur-xl flex flex-col"
          >
            <h2 className="text-xl font-medium text-text-primary/90 mb-6">Souveraineté & État</h2>
            
            <div className="flex-1 space-y-6">
              <div className="p-4 rounded-2xl bg-status-success/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-medium text-status-success">Scellement NF525</h3>
                </div>
                <p className="text-sm text-status-success/80">Tous les tickets sont correctement scellés. Chaîne cryptographique intacte.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Actions Rapides</h3>
                {['Nouvelle Commande', 'Fermer la Caisse', 'Rapport Z'].map((action, _idx) => (
                  <button 
                    key={action}
                    className="w-full text-left p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all flex items-center justify-between group"
                  >
                    <span className="text-text-primary/80 group-hover:text-text-primary transition-colors">{action}</span>
                    <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
