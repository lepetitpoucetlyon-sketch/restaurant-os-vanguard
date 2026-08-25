'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import type { WidgetProps } from '../types';

export function LiveRevenueWidget({ className }: WidgetProps) {
    return (
        <div className={`p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col justify-between h-full ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wider text-text-secondary">CA du Jour</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                </span>
            </div>
            <div className="my-2">
                <div className="text-2xl font-black text-text-primary font-mono">1 842,50 €</div>
                <div className="text-micro text-emerald-500 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowUpRight className="w-3 h-3" /> +14.2% vs J-7
                </div>
            </div>
            <div className="text-nano text-text-muted border-t border-border-subtle pt-2 flex justify-between">
                <span>58 couverts</span>
                <span>Panier : 31,76 €</span>
            </div>
        </div>
    );
}

export function WeatherWidget({ className }: WidgetProps) {
    return (
        <div className={`p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col justify-between h-full ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wider text-text-secondary">Terrasse & Météo</span>
                <span className="text-base">☀️</span>
            </div>
            <div className="my-2">
                <div className="text-2xl font-black text-text-primary">24°C</div>
                <div className="text-micro text-text-secondary mt-0.5 font-medium">Ensoleillé • Vent faible (8 km/h)</div>
            </div>
            <div className="text-nano text-emerald-500 border-t border-border-subtle pt-2 font-medium">
                Conditions idéales : +35% capacité terrasse
            </div>
        </div>
    );
}

export function ProbeWidget({ className }: WidgetProps) {
    return (
        <div className={`p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col justify-between h-full ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wider text-text-secondary">Sondes Frigo HACCP</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2 my-2">
                <div className="p-2 rounded-xl bg-surface-bg border border-border-subtle">
                    <div className="text-nano text-text-muted">Chambre Froide Pos.</div>
                    <div className="text-sm font-bold font-mono text-emerald-500 mt-0.5">+3.2°C</div>
                </div>
                <div className="p-2 rounded-xl bg-surface-bg border border-border-subtle">
                    <div className="text-nano text-text-muted">Congélateur Neg.</div>
                    <div className="text-sm font-bold font-mono text-emerald-500 mt-0.5">-19.4°C</div>
                </div>
            </div>
            <div className="text-nano text-text-muted border-t border-border-subtle pt-2">
                Conforme PMS DGAL • 2/2 sondes actives
            </div>
        </div>
    );
}

export function ReviewsWidget({ className }: WidgetProps) {
    return (
        <div className={`p-4 rounded-2xl bg-surface-card border border-border-default flex flex-col justify-between h-full ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <span className="text-micro font-semibold uppercase tracking-wider text-text-secondary">Avis Récents</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <span>★</span> 4.8 / 5
                </div>
            </div>
            <div className="my-2 p-2 rounded-xl bg-surface-bg border border-border-subtle text-xs">
                <div className="font-semibold text-text-primary truncate">« Service rapide et plats délicieux ! »</div>
                <div className="text-nano text-text-muted mt-0.5 flex justify-between">
                    <span>Sophie D. • Google</span>
                    <span>Il y a 2h</span>
                </div>
            </div>
            <div className="text-nano text-text-secondary border-t border-border-subtle pt-2 flex justify-between">
                <span>342 avis au total</span>
                <span className="text-action-primary font-medium cursor-pointer">Voir tout</span>
            </div>
        </div>
    );
}
