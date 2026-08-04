"use client";

import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { tenantIdAtom, fleetSnapshotAtom } from '@/store/pillars/sovereign';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Globe, 
    ShieldCheck, 
    AlertTriangle, 
    Activity,
    Zap,
    Building2
} from "lucide-react";
import { cn } from '@/lib/ui.foundations';
import { Button } from '@ui/button';
import { useToast } from '@components/ui/Toast';

import { FleetCommander } from '@/shared/nexus/engines/Intelligence/ia/fleet/FleetCommander';

/**
 * 🛰️ TenantOrchestrator - Restaurant OS
 * The fleet commander interface. Allows switching between restaurant instances.
 */
export const TenantOrchestrator: React.FC = () => {
    const [activeTenantId, setActiveTenantId] = useAtom(tenantIdAtom);
    const fleet = useAtomValue(fleetSnapshotAtom);
    const { showToast } = useToast();

    // HYDRATION: Bridge mock data with FleetCommander logic for evaluation
    const displayFleet = fleet.length > 0 ? fleet : [
        { id: 'restaurant-os', name: 'Master Kitchen (HQ)', status: 'ONLINE', metrics: { dailyRevenue: 4500, alerts: 0, errorRate: 0.01, uptime: 99.9 } },
        { id: 'bistro-lyon', name: 'Bistro Lyon 2', status: 'ONLINE', metrics: { dailyRevenue: 2800, alerts: 2, errorRate: 0.05, uptime: 99.1 } },
        { id: 'trattoria-paris', name: 'Trattoria Marais', status: 'CRITICAL', metrics: { dailyRevenue: 1200, alerts: 8, errorRate: 0.15, uptime: 95.0 } },
        { id: 'brasserie-lille', name: 'Le Nord Brasserie', status: 'MAINTENANCE', metrics: { dailyRevenue: 0, alerts: 0, errorRate: 0, uptime: 100 } },
    ].map(inst => {
        const metrics = (inst as { metrics?: { alerts?: number; errorRate?: number; uptime?: number } }).metrics || { alerts: 0, errorRate: 0, uptime: 100 };
        const health = FleetCommander.evaluateHealth(metrics.alerts || 0, metrics.errorRate || 0, metrics.uptime || 0);
        return {
            ...inst,
            metrics: { ...metrics, healthScore: health }
        } as (typeof fleet)[number];
    });

    const handleSwitch = (tenantId: string, name: string) => {
        if (tenantId === activeTenantId) return;
        
        setActiveTenantId(tenantId);
        localStorage.setItem('nexus_tenant_id', tenantId);
        showToast(`Orchestration basculée : ${name}`, "success");
    };

    return (
        <div className="bg-white dark:bg-bg-secondary rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden relative">
            {/* Header / HUD Style */}
            <div className="px-8 py-8 border-b border-border/50 bg-bg-tertiary/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
                
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Globe className="w-5 h-5 text-accent-gold" strokeWidth={2.5} />
                            <h2 className="text-xl font-serif font-black italic tracking-tight text-text-primary">Fleet Commander<span className="text-accent-gold">.</span></h2>
                        </div>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">Orchestration Multi-Tenant Active</p>
                    </div>
                    <div className="flex gap-2">
                         <div className="px-4 py-2 bg-text-primary text-text-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3 text-success animate-pulse" />
                            {displayFleet.length} INSTANCES
                         </div>
                    </div>
                </div>
            </div>

            {/* Instance List */}
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto elegant-scrollbar">
                {displayFleet.map((instance) => {
                    const isActive = instance.id === activeTenantId;
                    const isError = instance.status === 'CRITICAL';
                    const _isMaintenance = instance.status === 'MAINTENANCE';

                    return (
                        <motion.button
                            key={instance.id}
                            onClick={() => handleSwitch(instance.id, instance.name)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-full text-left p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group",
                                isActive 
                                    ? "bg-text-primary border-text-primary shadow-xl shadow-text-primary/10" 
                                    : "bg-bg-primary border-border hover:border-accent-gold/30 hover:bg-bg-tertiary/50"
                            )}
                        >
                            {/* Visual Feedback for active store */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="absolute right-6 top-1/2 -translate-y-1/2"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center text-bg-primary shadow-lg">
                                            <Zap className="w-5 h-5 fill-bg-primary" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-start gap-5 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                                    isActive ? "bg-white/10 text-text-primary" : "bg-bg-tertiary text-text-muted",
                                    isError && !isActive && "bg-error/10 text-error"
                                )}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                
                                <div className="flex-1 pr-12">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={cn(
                                            "text-lg font-serif italic font-black transition-colors",
                                            isActive ? "text-text-primary" : "text-text-primary"
                                        )}>
                                            {instance.name}
                                        </h3>
                                        {isError && <AlertTriangle className="w-4 h-4 text-error" />}
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                instance.status === 'ONLINE' ? "bg-success" : 
                                                isError ? "bg-error" : "bg-warning animate-pulse"
                                            )} />
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest",
                                                isActive ? "text-text-primary/50" : "text-text-muted"
                                            )}>
                                                {instance.status}
                                            </span>
                                        </div>
                                        {instance.metrics && (
                                            <div className="flex items-center gap-3">
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest",
                                                    isActive ? "text-text-primary/50" : "text-text-muted"
                                                )}>
                                                    Health: {instance.metrics.healthScore}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Grid Line */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 h-1 bg-accent-gold w-full transition-all duration-1000 origin-left" />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer / Connection Status */}
            <div className="p-6 bg-bg-tertiary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Canal Ssécurisé • AES-256</span>
                </div>
                <Button variant="ghost" className="h-8 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-bg-tertiary">
                    Paramètres Flotte
                </Button>
            </div>
        </div>
    );
};
