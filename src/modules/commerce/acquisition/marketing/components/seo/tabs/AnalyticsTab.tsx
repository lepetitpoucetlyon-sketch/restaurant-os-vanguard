import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, TrendingUp, BarChart3, Search } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { seoProfileAtom, seoLoadingAtom } from '@/store/pillars/marketing';
import { StatCard } from "@/shared/components/ui";
import { cn } from "@/lib/ui.foundations";

export const AnalyticsTab = () => {
    const profile = useAtomValue(seoProfileAtom);
    const isLoading = useAtomValue(seoLoadingAtom);

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
                    value={(analytics.impressions ?? 0).toLocaleString()}
                    icon={<Eye />}
                    trend={{ value: 0, direction: "up" }}
                />
                <StatCard
                    label="Clics"
                    value={(analytics.clicks ?? 0).toLocaleString()}
                    icon={<Zap />}
                    trend={{ value: 0, direction: "up" }}
                />
                <StatCard
                    label="CTR"
                    value={`${(analytics.ctr ?? 0)}%`}
                    icon={<TrendingUp />}
                />
                <StatCard
                    label="Position moyenne"
                    value={(analytics.avgPosition ?? 0)?.toFixed(1) || "0.0"}
                    icon={<BarChart3 />}
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
                             {(analytics.topKeywords ?? []).map((kw: { term: string; clicks: number; avgPosition: number }, i: number) => (
                                <tr key={i} className="border-b border-border/50">
                                    <td className="py-4 pr-4 text-sm font-medium text-text-primary">{kw.term}</td>
                                    <td className="py-4 px-4 text-right text-sm text-text-muted">{kw.clicks}</td>
                                    <td className={cn(
                                        "py-4 px-4 text-right text-sm font-bold",
                                        kw.avgPosition <= 3 ? 'text-[#00D9A6]' :
                                            kw.avgPosition <= 10 ? 'text-action-primary' :
                                                'text-status-danger'
                                    )}>
                                        {kw.avgPosition.toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                            {(analytics.topKeywords ?? []).length === 0 && (
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
