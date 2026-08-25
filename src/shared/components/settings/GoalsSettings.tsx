"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
    Target,
    Loader2,
    TrendingUp,
    Users,
    Utensils,
    Percent,
    Star,
    Calendar,
    Zap,
    ArrowUpRight,
    Activity,
    LayoutPanelTop,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
interface GoalConfig {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    unit: string;
    key: keyof typeof defaultGoals;
    description: string;
}

const defaultGoals = {
    dailyRevenue: 3000,
    weeklyRevenue: 18000,
    monthlyRevenue: 75000,
    avgTicket: 45,
    occupancyRate: 75,
    dailyCovers: 80,
    foodCostPercent: 30,
    laborCostPercent: 35,
    avgReviewScore: 4.5,
    noShowPercent: 5,
};

const GOALS_CONFIG: GoalConfig[] = [
    { id: 'daily', label: 'Daily Yield', description: '24h Revenue Target', icon: TrendingUp, color: '#10B981', unit: '€', key: 'dailyRevenue' },
    { id: 'weekly', label: 'Weekly Velocity', description: '7d Revenue Accumulation', icon: Activity, color: '#3B82F6', unit: '€', key: 'weeklyRevenue' },
    { id: 'monthly', label: 'Monthly Horizon', description: '30d Fiscal Zenith', icon: LayoutPanelTop, color: '#6366F1', unit: '€', key: 'monthlyRevenue' },
    { id: 'ticket', label: 'Mean Ticket', description: 'Average Transaction Value', icon: Utensils, color: '#F59E0B', unit: '€', key: 'avgTicket' },
    { id: 'occupancy', label: 'Spatial Density', description: 'Seat Utilization Rate', icon: Calendar, color: '#8B5CF6', unit: '%', key: 'occupancyRate' },
    { id: 'covers', label: 'Daily Throughput', description: 'Total Client Cycles', icon: Users, color: '#EC4899', unit: '', key: 'dailyCovers' },
    { id: 'foodcost', label: 'Material Ratio', description: 'Food Expenditure Efficiency', icon: Percent, color: '#F43F5E', unit: '%', key: 'foodCostPercent' },
    { id: 'labor', label: 'Human Capital', description: 'Staff Expenditure Ratio', icon: ShieldCheck, color: '#64748B', unit: '%', key: 'laborCostPercent' },
    { id: 'reviews', label: 'Semantic Score', description: 'Public Perception Index', icon: Star, color: '#FBBF24', unit: '/5', key: 'avgReviewScore' },
    { id: 'noshow', label: 'Shadow Rate', description: 'Reservation Abandonment', icon: Zap, color: '#EF4444', unit: '%', key: 'noShowPercent' },
];

export default function GoalsSettings() {
    const { settings, updateGoals, isSaving } = useSettings();
    const initialGoals = { ...defaultGoals, ...settings.goals };
    const [draftGoals, setDraftGoals] = useState<typeof initialGoals | null>(null);
    const goals = draftGoals ?? initialGoals;

    const handleSave = async () => {
        await updateGoals(goals);
        setDraftGoals(null);
    };

    const updateGoal = (key: string, value: number) => {
        setDraftGoals(g => ({ ...(g ?? initialGoals), [key]: value }));
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Fiscal Core (Revenue Goals) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Fiscal Trajectory
                        </h3>
                        <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Revenue Targets & Growth Vectors</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {GOALS_CONFIG.filter(g => g.key.includes('Revenue')).map((goal) => {
                        const Icon = goal.icon;
                        return (
                            <motion.div
                                key={goal.id}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="relative bg-bg-primary p-8 rounded-[2rem] border border-border shadow-sm group hover:border-accent/40 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-bg-tertiary rounded-xl shadow-inner border border-border">
                                        <Icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-text-muted" />
                                </div>
                                <label className="block text-nano font-bold text-text-muted uppercase tracking-widest mb-3">
                                    {goal.label}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={goals[goal.key] || 0}
                                        onChange={(e) => updateGoal(goal.key, Number(e.target.value))}
                                        className="w-full bg-transparent text-3xl font-serif text-text-primary outline-none pr-10"
                                        data-tutorial={goal.key === 'dailyRevenue' ? 'settings-2-0' : undefined}
                                    />
                                    <span className="absolute right-0 bottom-1.5 text-xs font-bold text-text-muted uppercase">
                                        {goal.unit}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-bg-tertiary rounded-full mt-6 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '70%' }}
                                        className="h-full rounded-full bg-accent"
                                    />
                                </div>
                                <p className="text-nano font-bold text-text-muted uppercase mt-2 tracking-widest">{goal.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Matrix Metrics (All Goals Grid) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Operational Vectors
                        </h3>
                        <p className="text-nano font-bold text-text-muted uppercase tracking-widest">KPI Thresholds & Quality Metrics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {GOALS_CONFIG.filter(g => !g.key.includes('Revenue')).map((goal, idx) => {
                        const Icon = goal.icon;
                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + (idx * 0.05) }}
                                whileHover={{ scale: 1.01 }}
                                className="p-8 bg-bg-primary rounded-[2rem] border border-border shadow-sm flex flex-col justify-between hover:border-accent/40 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-5">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner bg-bg-tertiary border border-border text-accent"
                                        >
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-serif text-text-primary uppercase tracking-tight text-lg italic">{goal.label}</p>
                                            <p className="text-nano font-bold text-text-muted uppercase tracking-widest">{goal.description}</p>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            step={goal.key === 'avgReviewScore' ? 0.1 : 1}
                                            value={goals[goal.key] || 0}
                                            onChange={(e) => updateGoal(goal.key, Number(e.target.value))}
                                            className="w-24 text-right bg-transparent text-2xl font-serif text-text-primary outline-none"
                                            data-tutorial={goal.key === 'laborCostPercent' ? 'settings-2-1' : undefined}
                                        />
                                        <span className="block text-nano font-bold text-text-muted text-right uppercase tracking-[0.2em]">{goal.unit || 'Nodes'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-nano font-bold text-text-muted uppercase tracking-[0.2em]">Target Intensity</span>
                                        <span className="text-nano font-bold text-accent uppercase tracking-[0.2em]">65% Realized</span>
                                    </div>
                                    <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden p-0.5 border border-border/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '65%' }}
                                            className="h-full rounded-full shadow-lg bg-accent"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Logic Hooks (Alerts on Goals) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Threshold Logic
                        </h3>
                        <p className="text-nano font-bold text-text-muted uppercase tracking-widest">Automatic Neural Signal Triggers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Fiscal Zenith Attained', status: true, color: 'text-accent' },
                        { label: 'Material Overrun Detection', status: true, color: 'text-status-danger' },
                        { label: 'Saturation Limit (>90%)', status: false, color: 'text-status-warning' },
                        { label: 'Semantic Criticality Alert', status: true, color: 'text-brand' }
                    ].map((alert, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-bg-primary rounded-[1.5rem] border border-border hover:border-accent/40 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-2 h-2 rounded-full", alert.status ? "bg-accent" : "bg-bg-tertiary")} />
                                <span className="text-xs font-bold text-text-primary uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{alert.label}</span>
                            </div>
                            <button className={cn(
                                "w-12 h-6 rounded-full relative transition-all duration-300",
                                alert.status ? "bg-accent" : "bg-bg-tertiary border border-border shadow-inner"
                            )}>
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 bg-surface-card rounded-full shadow-sm transition-all",
                                    alert.status ? "right-1" : "left-1"
                                )} />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <ArrowUpRight className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:-translate-y-1 group-hover:translate-x-1" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Strategic Vector
                </motion.button>
            </div>
        </div>
    );
}
