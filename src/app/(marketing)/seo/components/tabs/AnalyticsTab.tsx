// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, TrendingUp, BarChart3, Search } from 'lucide-react';
import { StatCard } from "@/app/(marketing)/seo/components/StatCard";
import { useMarketing } from '@/engines/ops/NexusOpsProvider';
import { cn } from "@/lib/ui.foundations";

export const AnalyticsTab = () => {
    const { profile, isLoading } = useMarketing();

    // Derive real analytics or use baseline zeros (reality check)
    const analytics = profile?.analytics || {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        avgPosition: 0,
        topKeywords: []
    };

    return (
        <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Impressions"
                    value={analytics.impressions.toLocaleString()}
                    icon={Eye}
                    change={{ value: 0, isPositive: true }}
                />
                <StatCard
                    label="Clics"
                    value={analytics.clicks.toLocaleString()}
                    icon={Zap}
                    change={{ value: 0, isPositive: true }}
                />
                <StatCard
                    label="CTR"
                    value={`${analytics.ctr}%`}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Position moyenne"
                    value={analytics.avgPosition?.toFixed(1) || "0.0"}
                    icon={BarChart3}
                />
            </div>

            <div className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Top mots-clés</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-muted border-b border-border">
                                <th className="pb-4 pr-4">Mot-clé</th>
                                <th className="pb-4 px-4 text-right">Clics</th>
                                <th className="pb-4 px-4 text-right">Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topKeywords.map((kw: any, i: number) => (
                                <tr key={i} className="border-b border-border/50">
                                    <td className="py-4 pr-4 text-sm font-medium text-text-primary">{kw.keyword}</td>
                                    <td className="py-4 px-4 text-right text-sm text-text-muted">{kw.clicks}</td>
                                    <td className={cn(
                                        "py-4 px-4 text-right text-sm font-bold",
                                        kw.position <= 3 ? 'text-[#00D9A6]' :
                                            kw.position <= 10 ? 'text-amber-500' :
                                                'text-rose-500'
                                    )}>
                                        {kw.position.toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                            {analytics.topKeywords.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-text-muted text-[10px] font-black uppercase tracking-widest">
                                        Aucun mot-clé détecté pour le moment
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
