import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { ScoreGauge } from "@/app/(marketing)/seo/components/ScoreGauge";
import { StatCard } from "@/app/(marketing)/seo/components/StatCard";
import { PageCard } from "@/app/(marketing)/seo/components/PageCard";
import { GoogleProfileCard } from "@/app/(marketing)/seo/components/GoogleProfileCard";
import { KeywordsCard } from "@/app/(marketing)/seo/components/KeywordsCard";
import { MarketingEngine } from '@/lib/marketing-engine';
import { useMarketing } from '@/engines/ops/NexusOpsProvider';
import { cn } from '@/lib/ui.foundations';

export const OverviewTab = () => {
    const { profile, isLoading } = useMarketing();
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
                        value={analytics.impressions.toLocaleString()}
                        icon={Eye}
                        change={{ value: 0, isPositive: true }}
                    />
                    <StatCard
                        label="Clics (7j)"
                        value={analytics.clicks.toLocaleString()}
                        icon={Zap}
                        change={{ value: 0, isPositive: true }}
                    />
                    <StatCard
                        label="CTR moyen"
                        value={`${analytics.ctr}%`}
                        icon={TrendingUp}
                        change={{ value: 0, isPositive: true }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Analyse des Pages</h3>
                    </div>
                    {livePages.map((page, idx) => (
                        <PageCard
                            key={page.id}
                            page={page as any}
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
