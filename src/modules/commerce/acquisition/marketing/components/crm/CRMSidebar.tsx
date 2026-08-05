"use client";

import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Users, Search, Star, Heart, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useLanguage } from '@/shared/hooks';
import { motion } from 'framer-motion';
import { 
    crmSearchQueryAtom, 
    crmFilterSegmentAtom,
    crmNewCRMModalAtom
} from '../../store/crmAtoms';
import { crmsAtom } from '../../store/marketingAtoms';

const SEGMENTS = {
    vip: { name: 'VIP', color: '#8B5CF6', icon: Star },
    regular: { name: 'Régulier', color: '#C5A059', icon: Heart },
    new: { name: 'Nouveau', color: '#4285F4', icon: Plus },
    lost: { name: 'À réactiver', color: '#FF9900', icon: AlertCircle },
};

export function CRMSidebar() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useAtom(crmSearchQueryAtom);
    const [filterSegment, setFilterSegment] = useAtom(crmFilterSegmentAtom);
    const [, setNewCRMModalOpen] = useAtom(crmNewCRMModalAtom);
    const crms = useAtomValue(crmsAtom);

    const getCount = (key: string | null) => {
        if (!key) return crms.length;
        return crms.filter((c) => c.segment === key).length;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[420px] bg-bg-secondary border-r border-border hidden md:flex flex-col p-8 gap-10"
        >
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30 group-focus-within:text-accent-gold transition-colors" />
                <input
                    type="text"
                    placeholder={t('crm.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-16 pr-8 bg-bg-tertiary/50 rounded-[2rem] border-none font-sans font-black text-[10px] text-text-primary outline-none tracking-widest focus:bg-bg-tertiary transition-all"
                />
            </div>

            <div className="space-y-4 flex-1">
                <button
                    onClick={() => (setNewCRMModalOpen as (v: boolean) => void)(true)}
                    className="w-full h-16 bg-accent-gold text-text-primary rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all mb-4"
                >
                    <Plus className="w-4 h-4" />
                    {t('crm.add_crm') || 'Ajouter Client'}
                </button>

                <button
                    onClick={() => (setFilterSegment as (v: string | null) => void)(null)}
                    className={cn(
                        "w-full flex items-center justify-between px-8 py-5 rounded-[2rem] transition-all relative group",
                        !filterSegment ? "bg-accent-gold/10 text-accent-gold shadow-sm" : "text-text-muted hover:bg-bg-tertiary"
                    )}
                >
                    <div className="flex items-center gap-5 relative z-10">
                        <Users className={cn("w-5 h-5", !filterSegment ? "text-accent-gold" : "text-text-muted/30")} />
                        <span className="font-black text-[11px] tracking-[0.2em] uppercase">
                            {t('crm.global_portfolio') || 'Portefeuille Global'}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold opacity-50">{getCount(null)}</span>
                </button>

                {Object.entries(SEGMENTS).map(([key, segment]) => {
                    const Icon = segment.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => (setFilterSegment as (v: string | null) => void)(filterSegment === key ? null : key)}
                            className={cn(
                                "w-full flex items-center justify-between px-8 py-5 rounded-[2rem] transition-all",
                                filterSegment === key ? "text-text-primary bg-bg-tertiary shadow-sm" : "text-text-muted hover:bg-bg-tertiary"
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center border border-border bg-bg-primary transition-transform group-hover:scale-105",
                                    filterSegment === key && "border-accent-gold/20"
                                )}>
                                    <Icon className="w-5 h-5" style={{ color: segment.color }} />
                                </div>
                                <span className="font-black text-[11px] tracking-[0.2em] uppercase">
                                    {t(`crm.segments.${key}`) || segment.name}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold opacity-50">{getCount(key)}</span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
