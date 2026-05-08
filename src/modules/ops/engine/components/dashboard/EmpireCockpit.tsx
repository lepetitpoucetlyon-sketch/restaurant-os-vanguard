"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { 
    dashboardRevenueSelector, 
    dashboardHACCPAlertsSelector, 
    dashboardStockRupturesSelector,
    dashboardActiveTablesSelector
} from '@/store/dashboardAtoms';
import { 
    TrendingUp, 
    AlertTriangle, 
    Package, 
    Users, 
    ChevronRight,
    ShieldCheck
} from 'lucide-react';

/**
 * 🏛️ EMPIRE COCKPIT - Grade VI
 * The central high-fidelity dashboard for the restaurant owner.
 * Visualizes the 5 pillars of the "Starter Pack".
 */
export const EmpireCockpit: React.FC = () => {
    const revenueInCents = useAtomValue(dashboardRevenueSelector);
    const haccpAlerts = useAtomValue(dashboardHACCPAlertsSelector);
    const stockRuptures = useAtomValue(dashboardStockRupturesSelector);
    const activeTables = useAtomValue(dashboardActiveTablesSelector);

    const revenue = (revenueInCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    const kpis = [
        {
            title: "Chiffre d'Affaires",
            value: revenue,
            sub: "Aujourd'hui",
            icon: TrendingUp,
            color: "text-status-success",
            bg: "bg-status-success/10",
        },
        {
            title: "Santé HACCP",
            value: haccpAlerts,
            sub: haccpAlerts > 0 ? "Alertes péremption" : "Conformité Totale",
            icon: ShieldCheck,
            color: haccpAlerts > 0 ? "text-status-warning" : "text-brand",
            bg: haccpAlerts > 0 ? "bg-status-warning/10" : "bg-action-primary/10",
        },
        {
            title: "Ruptures Stock",
            value: stockRuptures,
            sub: "Produits critiques",
            icon: Package,
            color: stockRuptures > 0 ? "text-status-danger" : "text-muted",
            bg: stockRuptures > 0 ? "bg-status-danger/10" : "bg-surface-tertiary/10",
        },
        {
            title: "Flux Tables",
            value: activeTables,
            sub: "Commandes actives",
            icon: Users,
            color: "text-status-success",
            bg: "bg-status-success/10",
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            {kpis.map((kpi, i) => (
                <div 
                    key={i}
                    className="relative overflow-hidden group p-6 rounded-2xl bg-surface-sidebar border border-default shadow-xl hover:border-default transition-all duration-300"
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${kpi.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted mb-1">{kpi.title}</p>
                            <h3 className={`text-2xl font-bold ${kpi.color} tracking-tight`}>
                                {kpi.value}
                            </h3>
                            <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                                {kpi.sub}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon size={24} />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center text-xs font-semibold text-secondary uppercase tracking-wider group-hover:text-muted cursor-pointer">
                        Voir les détails
                        <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            ))}
        </div>
    );
};
