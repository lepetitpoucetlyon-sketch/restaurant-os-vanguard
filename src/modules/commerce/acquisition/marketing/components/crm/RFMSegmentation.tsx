'use client';

import { useMemo } from 'react';
import type { Customer } from '@nexus/contracts';
import { TrendingUp, Clock, Repeat, Banknote, Crown, AlertTriangle, Moon, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

// ── RFM helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr?: string): number {
    if (!dateStr) return 9999;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function score3(value: number, ascending: boolean, p33: number, p66: number): 1 | 2 | 3 {
    if (ascending) {
        if (value <= p33) return 3;
        if (value <= p66) return 2;
        return 1;
    } else {
        if (value >= p66) return 3;
        if (value >= p33) return 2;
        return 1;
    }
}

function percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

type Segment = 'champion' | 'loyal' | 'at_risk' | 'dormant' | 'new' | 'regular';

interface RFMRow {
    customer: Customer;
    r: number;  // récence (days)
    f: number;  // fréquence
    m: number;  // montant (cents)
    rScore: 1 | 2 | 3;
    fScore: 1 | 2 | 3;
    mScore: 1 | 2 | 3;
    total: number;
    segment: Segment;
}

const SEGMENT_META: Record<Segment, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
    champion:  { label: 'Champions',    color: 'text-action-primary',  bg: 'bg-action-primary/10 border-yellow-500/30', icon: Crown,        desc: 'Clients récents, fréquents et dépensiers' },
    loyal:     { label: 'Fidèles',      color: 'text-blue-500',    bg: 'bg-status-info/10 border-blue-500/30',     icon: Star,         desc: 'Haute fréquence, bonne valeur' },
    at_risk:   { label: 'À risque',     color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/30', icon: AlertTriangle, desc: 'Bonne valeur passée, absents récemment' },
    dormant:   { label: 'Dormants',     color: 'text-text-muted',  bg: 'bg-surface-glass border-border',      icon: Moon,         desc: 'Inactifs depuis longtemps' },
    new:       { label: 'Nouveaux',     color: 'text-status-success', bg: 'bg-status-success/10 border-status-success/30', icon: Sparkles, desc: 'Récents, peu de visites' },
    regular:   { label: 'Réguliers',    color: 'text-action-primary', bg: 'bg-action-primary/10 border-action-primary/30', icon: Repeat,   desc: 'Profil équilibré' },
};

function classify(rScore: number, fScore: number, mScore: number, r: number): Segment {
    const total = rScore + fScore + mScore;
    if (total >= 8) return 'champion';
    if (r <= 30 && fScore === 1) return 'new';
    if (fScore >= 2 && mScore >= 2) return 'loyal';
    if (rScore === 1 && mScore >= 2) return 'at_risk';
    if (rScore === 1 && fScore === 1) return 'dormant';
    return 'regular';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    customers: Customer[];
}

export function RFMSegmentation({ customers }: Props) {
    const rows = useMemo<RFMRow[]>(() => {
        if (!customers.length) return [];

        const recencies = customers.map(c => daysSince(c.lastVisitDate));
        const frequencies = customers.map(c => c.visitCount ?? 0);
        const amounts = customers.map(c => c.totalSpentInMicrounits ?? (c.totalSpentInCents ?? 0) * 10_000);

        const rP33 = percentile(recencies, 33);
        const rP66 = percentile(recencies, 66);
        const fP33 = percentile(frequencies, 33);
        const fP66 = percentile(frequencies, 66);
        const mP33 = percentile(amounts, 33);
        const mP66 = percentile(amounts, 66);

        return customers.map(customer => {
            const r = daysSince(customer.lastVisitDate);
            const f = customer.visitCount ?? 0;
            const m = customer.totalSpentInMicrounits ?? (customer.totalSpentInCents ?? 0) * 10_000;
            const rScore = score3(r, true, rP33, rP66);
            const fScore = score3(f, false, fP33, fP66);
            const mScore = score3(m, false, mP33, mP66);
            const total = rScore + fScore + mScore;
            const segment = classify(rScore, fScore, mScore, r);
            return { customer, r, f, m, rScore, fScore, mScore, total, segment };
        });
    }, [customers]);

    const bySegment = useMemo(() => {
        const map: Partial<Record<Segment, RFMRow[]>> = {};
        for (const row of rows) {
            if (!map[row.segment]) map[row.segment] = [];
            map[row.segment]!.push(row);
        }
        return map;
    }, [rows]);

    if (!customers.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
                <TrendingUp className="w-10 h-10 opacity-30" />
                <p className="text-sm">Aucun client à segmenter</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-action-primary" />
                    Segmentation RFM
                </h2>
                <p className="text-xs text-text-muted mt-1">
                    Récence · Fréquence · Montant — {customers.length} clients analysés
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.entries(SEGMENT_META) as [Segment, typeof SEGMENT_META[Segment]][]).map(([seg, meta]) => {
                    const count = bySegment[seg]?.length ?? 0;
                    const Icon = meta.icon;
                    return (
                        <div key={seg} className={cn("rounded-xl border p-4 space-y-2", meta.bg)}>
                            <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", meta.color)} />
                                <span className={cn("text-xs font-bold uppercase tracking-wide", meta.color)}>{meta.label}</span>
                            </div>
                            <p className="text-2xl font-black text-text-primary">{count}</p>
                            <p className="text-nano text-text-muted leading-snug">{meta.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Per-segment customer list */}
            {(Object.entries(SEGMENT_META) as [Segment, typeof SEGMENT_META[Segment]][]).map(([seg, meta]) => {
                const segRows = bySegment[seg];
                if (!segRows?.length) return null;
                const Icon = meta.icon;
                return (
                    <div key={seg} className="space-y-2">
                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest w-fit", meta.bg, meta.color)}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label} ({segRows.length})
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-xs min-w-[33.75rem]">
                                <thead>
                                    <tr className="bg-surface-glass text-text-muted border-b border-border">
                                        <th className="px-4 py-2 text-left font-medium">Client</th>
                                        <th className="px-3 py-2 text-center font-medium">
                                            <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Récence</span>
                                        </th>
                                        <th className="px-3 py-2 text-center font-medium">
                                            <span className="flex items-center justify-center gap-1"><Repeat className="w-3 h-3" /> Visites</span>
                                        </th>
                                        <th className="px-3 py-2 text-center font-medium">
                                            <span className="flex items-center justify-center gap-1"><Banknote className="w-3 h-3" /> Total €</span>
                                        </th>
                                        <th className="px-3 py-2 text-center font-medium">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {segRows.sort((a, b) => b.total - a.total).map(row => (
                                        <tr key={row.customer.id} className="border-b border-border/50 hover:bg-surface-glass transition-colors">
                                            <td className="px-4 py-2 font-medium text-text-primary">
                                                {row.customer.firstName} {row.customer.lastName}
                                                {row.customer.email && (
                                                    <span className="block text-nano text-text-muted font-normal">{row.customer.email}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center text-text-muted">
                                                {row.r === 9999 ? '—' : `${row.r}j`}
                                            </td>
                                            <td className="px-3 py-2 text-center text-text-muted">{row.f}</td>
                                            <td className="px-3 py-2 text-center text-text-muted">
                                                {(row.m / 100).toFixed(0)} €
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black",
                                                    row.total >= 8 ? "bg-action-primary/20 text-action-primary" :
                                                    row.total >= 6 ? "bg-action-primary/20 text-action-primary" :
                                                    "bg-surface-glass text-text-muted"
                                                )}>
                                                    {row.total}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
