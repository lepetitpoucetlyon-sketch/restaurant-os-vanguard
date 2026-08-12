import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { seoProfileAtom, seoLoadingAtom } from '@/store/pillars/commerce';
import { ScoreGauge } from "../ScoreGauge";
import { StatCard } from "@design/ui";
import { PageCard } from "../PageCard";
import { GoogleProfileCard } from "../GoogleProfileCard";
import { KeywordsCard } from "../KeywordsCard";
import { MarketingEngine } from '../../../services/marketing-engine';
import { cn } from '@/lib/ui.foundations';

export const OverviewTab = () => {
    const profile = useAtomValue(seoProfileAtom);
    const isLoading = useAtomValue(seoLoadingAtom);
    const score = MarketingEngine.calculateSEOScore();
    const status = MarketingEngine.getVisibilityStatus(score);
    const livePages = MarketingEngine.getLivePageAnalysis();

    // Derive analytics from profile or use default empty stats
    const analytics = profile?.analytics || { impressions: 0, clicks: 0, ctr: 0 };

    return (
        <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border flex flex-col items-center justify-center" id="seo-score-gauge">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">Score SEO Global</p>
                    <ScoreGauge score={score} size={160} />
                    <p className={cn("text-sm font-bold mt-6", status.color)}>{status.label}</p>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Impressions (7j)"
                        value={(analytics.impressions ?? 0).toLocaleString()}
                        icon={<Eye />}
                        trend={{ value: 0, direction: "up" }}
                    />
                    <StatCard
                        label="Clics (7j)"
                        value={(analytics.clicks ?? 0).toLocaleString()}
                        icon={<Zap />}
                        trend={{ value: 0, direction: "up" }}
                    />
                    <StatCard
                        label="CTR moyen"
                        value={`${(analytics.ctr ?? 0)}%`}
                        icon={<TrendingUp />}
                        trend={{ value: 0, direction: "up" }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-action-primary" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Analyse des Pages</h3>
                    </div>
                    {livePages.map((page, idx) => (
                        <PageCard
                            key={page.id}
                            page={page as React.ComponentProps<typeof PageCard>['page']}
                            onEdit={() => { }}
                            id={idx === 0 ? "seo-page-to-optimize-0" : undefined}
                        />
                    ))}
                </div>

                <div className="space-y-6">
                    <GoogleProfileCard />
                    <KeywordsCard />
                </div>
            </div>
        </motion.div>
    );
};
