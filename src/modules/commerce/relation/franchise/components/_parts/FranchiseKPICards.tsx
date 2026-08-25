"use client";

import { TrendingUp, Users, Layers, AlertTriangle } from 'lucide-react';
import type { FranchiseConsolidatedMetrics } from '@/shared/nexus/contracts/franchise.types';

const EUR = { style: 'currency' as const, currency: 'EUR' as const };

export function FranchiseKPICards({ consolidated }: { consolidated: FranchiseConsolidatedMetrics }) {
    const revenue = (consolidated.totalTodayRevenueInCents / 100).toLocaleString('fr-FR', {
        ...EUR,
        maximumFractionDigits: 0,
    });
    const avgTicket = (consolidated.averageTicketInCents / 100).toLocaleString('fr-FR', EUR);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
                label="CA Réseau du Jour"
                value={revenue}
                sub={`Sur ${consolidated.totalSites} établissements actifs`}
                Icon={TrendingUp}
                iconClass="text-emerald-400"
            />
            <KPICard
                label="Couverts Totaux"
                value={String(consolidated.totalCoversServed)}
                sub={`${consolidated.totalOpenOrders} commandes en cours`}
                Icon={Users}
                iconClass="text-blue-400"
            />
            <KPICard
                label="Ticket Moyen Réseau"
                value={avgTicket}
                sub="Moyenne pondérée groupe"
                Icon={Layers}
                iconClass="text-amber-400"
            />
            <KPICard
                label="Alertes de Stock"
                value={String(consolidated.totalStockAlerts)}
                sub="Ruptures potentielles à rééquilibrer"
                Icon={AlertTriangle}
                iconClass="text-rose-400"
                valueClass="text-rose-400"
            />
        </div>
    );
}

function KPICard({
    label,
    value,
    sub,
    Icon,
    iconClass,
    valueClass = 'text-text-primary',
}: {
    label: string;
    value: string;
    sub: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    valueClass?: string;
}) {
    return (
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-text-secondary">
                <span className="text-micro font-bold uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${iconClass}`} />
            </div>
            <div className={`text-2xl font-black tracking-tight ${valueClass}`}>{value}</div>
            <p className="text-nano text-text-secondary">{sub}</p>
        </div>
    );
}
