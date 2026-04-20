"use client";

import { useState } from "react";
import {
    Instagram, Facebook, Share2, Plus, Megaphone, Users, Send, Eye, Target, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

import { SocialAccountCard } from "@/components/marketing/SocialAccountCard";
import { ScheduledPostItem } from "@/components/marketing/ScheduledPostItem";
import { CampaignCard } from "@/components/marketing/CampaignCard";
import { SegmentCard } from "@/components/marketing/SegmentCard";
import { NewPostModal } from "@/components/marketing/NewPostModal";
import { NewCampaignModal } from "@/components/marketing/NewCampaignModal";

import { useMarketing } from "@/engines/ops/NexusOpsProvider";

const PLATFORM_ICONS: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Share2, // Fallback
};

const PLATFORM_COLORS: Record<string, string> = {
    instagram: '#E4405F',
    facebook: '#1877F2',
};

const PLATFORM_GRADIENTS: Record<string, string> = {
    instagram: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    facebook: 'from-[#1877F2] to-[#0052CC]',
};

function BackgroundDecor() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>
    );
}

export default function SocialMarketingPage() {
    const { showToast } = useToast();
    const { profile, campaigns, socialAccounts, isLoading } = useMarketing();
    const [activeTab, setActiveTab] = useState<'social' | 'campaigns' | 'segments'>('social');
    const [showNewPost, setShowNewPost] = useState(false);
    const [showNewCampaign, setShowNewCampaign] = useState(false);

    // Map real social accounts to UI format
    const enrichedAccounts = (socialAccounts || []).map((acc: any) => ({
        ...acc,
        icon: PLATFORM_ICONS[(acc.platform as string)?.toLowerCase()] || Share2,
        color: PLATFORM_COLORS[(acc.platform as string)?.toLowerCase()] || '#888888',
        gradient: PLATFORM_GRADIENTS[(acc.platform as string)?.toLowerCase()] || 'from-neutral-500 to-neutral-700'
    }));

    // Scheduled posts would normally come from marketing state too, but let's assume they are handled via a common collection or subcollection
    // For now, if profile has posts, use them, otherwise empty
    const scheduledPosts = profile?.scheduledPosts || [];

    // CRM segments derived from profile or local state
    const crmSegments = profile?.crmSegments || [];

    return (
        <div className="relative min-h-screen bg-bg-primary/50 text-text-primary p-6 md:p-10 font-sans overflow-hidden">
            <BackgroundDecor />

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-border/40">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                                <Share2 className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">Social <span className="italic font-light opacity-50">Marketing</span></h1>
                        </div>
                        <p className="text-sm font-medium text-text-muted/80 max-w-lg">Gérez votre présence digitale et analysez vos performances depuis un hub centralisé.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-2 rounded-full border border-white/20 backdrop-blur-sm">
                        {[
                            { id: 'social', label: 'Réseaux', icon: Instagram },
                            { id: 'campaigns', label: 'Campagnes', icon: Megaphone },
                            { id: 'segments', label: 'CRM Segments', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                                    activeTab === tab.id ? "bg-text-primary text-bg-primary shadow-lg scale-105" : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5 mr-2 inline" />{tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'social' && (
                        <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {enrichedAccounts.length > 0 ? (
                                    enrichedAccounts.map((acc: any) => <SocialAccountCard key={acc.id} account={acc} />)
                                ) : (
                                    <p className="text-text-muted italic">Aucun compte social connecté.</p>
                                )}
                            </div>
                            <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-2xl font-serif font-medium tracking-tight">Publications Programmées</h3>
                                    <Button onClick={() => setShowNewPost(true)} className="h-14 px-8 bg-text-primary text-bg-primary rounded-full font-bold text-xs uppercase tracking-widest shadow-xl group">
                                        <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" /> Nouvelle Publication
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {scheduledPosts.length > 0 ? (
                                        scheduledPosts.map((post: any) => <ScheduledPostItem key={post.id} post={post} socialAccounts={enrichedAccounts} />)
                                    ) : (
                                        <p className="text-text-muted text-center py-10">Aucune publication programmée.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'campaigns' && (
                        <motion.div key="campaigns" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Campagnes', value: campaigns.length.toString(), icon: Send, color: 'text-text-primary' },
                                    { label: "Taux d'ouverture", value: `${profile?.analytics?.opened || 0}%`, icon: Eye, color: 'text-blue-500' },
                                    { label: 'Taux de clic', value: `${profile?.analytics?.clicked || 0}%`, icon: Target, color: 'text-amber-500' },
                                    { label: 'Conversions', value: `${profile?.analytics?.conversions || 0}%`, icon: Zap, color: 'text-purple-500' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 group cursor-crosshair relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-all">
                                            <stat.icon className={cn("w-12 h-12 opacity-10", stat.color)} />
                                        </div>
                                        <div className="relative z-10 min-h-[100px] flex flex-col justify-between">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{stat.label}</span>
                                            <p className="text-4xl font-serif font-medium tracking-tighter">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-serif font-medium italic">Campagnes Actives</h3>
                                    <Button onClick={() => setShowNewCampaign(true)} className="rounded-full h-10 px-6 font-bold text-xs uppercase tracking-widest">Créer campagne</Button>
                                </div>
                                <div className="space-y-4">
                                    {campaigns.length > 0 ? (
                                        campaigns.map((c: any) => <CampaignCard key={c.id} campaign={c} />)
                                    ) : (
                                        <p className="text-text-muted italic">Aucune campagne active.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'segments' && (
                        <motion.div key="segments" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {crmSegments.map((s: any) => <SegmentCard key={s.id} segment={s} />)}
                            <button onClick={() => showToast("Fonctionnalité à venir", "info")} className="group flex flex-col items-center justify-center gap-6 border-2 border-dashed border-text-muted/20 hover:border-text-primary/50 rounded-[2.5rem] p-8 transition-all min-h-[300px]">
                                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={32} className="text-text-muted group-hover:text-text-primary" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-serif font-bold">Nouveau Segment</span>
                                    <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">Créer une audience</span>
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <NewPostModal 
                isOpen={showNewPost} 
                onClose={() => setShowNewPost(false)} 
                socialAccounts={enrichedAccounts} 
            />

            <NewCampaignModal 
                isOpen={showNewCampaign} 
                onClose={() => setShowNewCampaign(false)} 
            />
        </div>
    );
}
