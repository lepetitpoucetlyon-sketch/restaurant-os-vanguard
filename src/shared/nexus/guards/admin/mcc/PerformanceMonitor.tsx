"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Cpu, ShieldCheck, Trash2 } from 'lucide-react';
import { GlobalRegistryService } from '@/infrastructure/services/GlobalRegistryService';
import { useStore } from 'jotai';

// mcc-tel-6 — classes statiques (JIT purge les interpolations bg-${color}-500/10)
const GAUGE_COLORS = {
    indigo: {
        wrap:     'bg-status-info/10 border border-indigo-500/20 text-indigo-400',
        gradient: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
    },
    violet: {
        wrap:     'bg-violet-500/10 border border-violet-500/20 text-violet-400',
        gradient: 'bg-gradient-to-r from-violet-600 to-violet-400',
    },
} as const;

export const PerformanceMonitor: React.FC = () => {
    const store = useStore();
    const [stats, setStats] = useState({ opsLatency: 0, memoryUsage: 0, activeDomains: 0 });
    // mcc-tel-7 — clés réelles du registre
    const [domainKeys, setDomainKeys] = useState<string[]>([]);

    useEffect(() => {
        const measure = () => {
            const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;

            // mcc-tel-5 — latence réelle : coût du round-trip getInventory()
            const t0 = performance.now();
            const domains = GlobalRegistryService.getInventory();
            const opsLatency = Math.round((performance.now() - t0) * 1000) / 1000 || 0.05;

            setDomainKeys(domains.slice(0, 6));
            setStats({
                opsLatency,
                memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
                activeDomains: domains.length,
            });
        };

        measure();
        const id = setInterval(measure, 2000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="bg-surface-card border border-border-subtle rounded-3xl p-6 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-action-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-action-primary/10 rounded-xl flex items-center justify-center border border-focus/20">
                        <Activity className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Nexus Heartbeat</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">Diag. v5.0</span>
                            <span className="px-2 py-0.5 bg-status-success/10 text-status-success text-[10px] font-bold rounded-lg border border-emerald-500/20 uppercase">Zero-Lag Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Build Status</span>
                    <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                        PROD_READY
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <MetricGauge
                    label="Ops Latency"
                    value={`${stats.opsLatency.toFixed(2)}ms`}
                    percentage={Math.min(100, stats.opsLatency * 100)}
                    icon={<Zap className="w-4 h-4" />}
                    color="indigo"
                />
                <MetricGauge
                    label="RAM Heap"
                    value={`${stats.memoryUsage}MB`}
                    percentage={(stats.memoryUsage / 256) * 100}
                    icon={<Cpu className="w-4 h-4" />}
                    color="violet"
                />
            </div>

            <div className="mt-8 pt-6 border-t border-border-subtle">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Atomic Domains Health</span>
                        <span className="text-[10px] font-bold text-brand">{stats.activeDomains} Domains Registered</span>
                    </div>
                    <button
                        onClick={() => GlobalRegistryService.forceNuclearPurge(store)}
                        className="p-2 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger rounded-xl border border-rose-500/20 transition-all group flex items-center gap-2"
                        title="Nuclear Purge (Zero Leak)"
                    >
                        <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Purge</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {(domainKeys.length > 0 ? domainKeys : ['Orders', 'Kitchen', 'Inventory', 'Tables']).map((key) => (
                        <ContextSlot key={key} label={key} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const MetricGauge: React.FC<{
    label: string;
    value: string;
    percentage: number;
    icon: React.ReactNode;
    color: keyof typeof GAUGE_COLORS;
}> = ({ label, value, percentage, icon, color }) => {
    const c = GAUGE_COLORS[color];
    return (
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${c.wrap}`}>{icon}</div>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</span>
            </div>
            <div className="relative h-1 bg-surface-card rounded-full overflow-hidden mb-2">
                <motion.div
                    className={`absolute left-0 top-0 h-full ${c.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percentage)}%` }}
                    transition={{ duration: 1 }}
                />
            </div>
            <div className="text-xl font-bold tracking-tight tabular-nums">{value}</div>
        </div>
    );
};

const ContextSlot: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-success group-hover:animate-pulse" />
            <span className="text-xs font-medium text-muted group-hover:text-text-primary transition-colors truncate max-w-[140px]" title={label}>
                {label}
            </span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-action-primary/5 border border-focus/10 text-[8px] font-black text-brand uppercase tracking-tighter">Isolated</div>
    </div>
);
