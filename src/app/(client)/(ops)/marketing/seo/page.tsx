"use client";

'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    Globe,
    TrendingUp,
    BarChart3,
    RefreshCw,
    Settings,
    FileText,
    X
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@ui/Button';
import { cn } from "@/lib/ui.foundations";

// Tab Components
import { OverviewTab, PagesTab, AnalyticsTab, SettingsTab } from "@/modules/commerce";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function SEOPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'analytics' | 'settings'>('overview');

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
        { id: 'pages', label: 'Pages', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Paramètres', icon: Settings }
    ];

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeSite = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 1200);
    };

    return (
        <div className="flex h-screen -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden relative font-sans">
            {/* Cinematic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
                <div className="absolute top-[30%] left-[20%] w-[20%] h-[20%] bg-action-primary/5 blur-[80px] rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-30 pt-10 px-12 pb-8 flex items-center justify-between border-b border-border bg-bg-primary/40 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
                        <Globe className="w-6 h-6 text-teal" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif italic font-black text-text-primary tracking-tight leading-none">
                            SEO & Référencement
                        </h1>
                        <p className="text-nano font-black uppercase tracking-[0.2em] text-text-muted mt-1">
                            Optimisez votre visibilité sur les moteurs de recherche
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleAnalyzeSite}
                        disabled={isAnalyzing}
                        className="h-12 px-8 bg-teal text-text-primary hover:bg-teal rounded-2xl font-black text-nano uppercase tracking-widest shadow-[0_8px_24px_rgba(0,217,166,0.25)] transition-all flex items-center gap-3 disabled:opacity-50"
                        id="seo-analyze-button"
                    >
                        <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
                        {isAnalyzing ? "Analyse en cours…" : "Analyser le site"}
                    </Button>
                    <Link href="/dashboard">
                        <button aria-label="Fermer" className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center hover:bg-bg-secondary transition-all group">
                            <X className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col px-12 pt-8">
                <div className="shrink-0 mb-8">
                    <div className="flex items-center gap-2 bg-bg-secondary/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-border" id="seo-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'pages' | 'analytics' | 'settings')}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-nano font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
                                    activeTab === tab.id
                                        ? "bg-text-primary text-bg-primary shadow-xl"
                                        : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                                )}
                                id={`seo-tab-${tab.id}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-12">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && <OverviewTab />}
                        {activeTab === 'pages' && <PagesTab />}
                        {activeTab === 'analytics' && <AnalyticsTab />}
                        {activeTab === 'settings' && <SettingsTab />}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default withPageGuard(SEOPage, "marketing");
