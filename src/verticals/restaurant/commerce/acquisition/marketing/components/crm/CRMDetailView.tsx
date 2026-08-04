"use client";

import React from 'react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { 
    X, Phone, Mail, Users, DollarSign, TrendingUp, Calendar, Send
} from 'lucide-react';
import { crmSelectedCRMAtom } from '@/verticals/restaurant/commerce/acquisition/marketing/store/crmAtoms';
import { useLanguage } from '@/shared/hooks';
import { cn } from '@/lib/ui.foundations';
import { useIsMobile } from '@/shared/hooks';
import { BottomSheet } from '@ui/BottomSheet';
import { Button } from '@ui/button';
import { CRM } from '@nexus/contracts';

const getFirstName = (c: CRM): string => c?.firstName || '';
const getLastName = (c: CRM): string => c?.lastName || '';
const getInitial = (s: string): string => (s && s.length > 0 ? s[0] : '?');
const getVisitCount = (c: CRM): number => c?.visitCount ?? 0;
const getPhone = (c: CRM): string => c?.phone ?? '';
const getEmail = (c: CRM): string => c?.email ?? '';

export function CRMDetailView() {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const [selectedCRM, setSelectedCRM] = useAtom(crmSelectedCRMAtom) as [CRM | null, (crm: CRM | null) => void];

    if (!selectedCRM) return null;

    const stats = [
        { value: getVisitCount(selectedCRM), label: 'Sessions', icon: Users },
        { value: `${((selectedCRM.totalSpentInMicrounits ?? (selectedCRM.totalSpentInCents ? selectedCRM.totalSpentInCents * 10_000 : 0)) / 1_000_000 || 0).toFixed(0)}€`, label: 'Revenue', icon: DollarSign, gold: true },
        { value: `${(((selectedCRM.totalSpentInMicrounits ?? (selectedCRM.totalSpentInCents ? selectedCRM.totalSpentInCents * 10_000 : 0)) / 1_000_000 || 0) / (getVisitCount(selectedCRM) || 1)).toFixed(0)}€`, label: 'Panier', icon: TrendingUp }
    ];

    if (isMobile) {
        return (
            <BottomSheet
                isOpen={true}
                onClose={() => setSelectedCRM(null)}
                title={selectedCRM.lastName || `${getFirstName(selectedCRM)} ${getLastName(selectedCRM)}`}
                subtitle={`Profil ${(selectedCRM.id || '').toUpperCase()} • ID: ${(selectedCRM.id || '').slice(0, 8)}`}
            >
                <div className="space-y-10 py-6">
                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((s, i) => (
                            <div key={i} className="bg-bg-tertiary p-5 rounded-[2rem] text-center border border-border/50">
                                <p className={cn("text-xl font-serif italic", s.gold ? "text-accent-gold" : "text-text-primary")}>{s.value}</p>
                                <p className="text-[7px] font-black text-text-muted/50 uppercase tracking-widest mt-1">{t(s.label) || s.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] px-2">{t('crm.contact_info') || 'INFOS CONTACT'}</h4>
                        <div className="p-5 bg-bg-tertiary rounded-3xl flex items-center gap-5">
                            <Phone className="w-5 h-5 text-accent-gold/40" />
                            <p className="text-sm font-bold tracking-[0.1em]">{getPhone(selectedCRM)}</p>
                        </div>
                        <div className="p-5 bg-bg-tertiary rounded-3xl flex items-center gap-5">
                            <Mail className="w-5 h-5 text-accent-gold/40" />
                            <p className="text-xs font-bold uppercase tracking-widest text-text-primary">{getEmail(selectedCRM)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6">
                        <Button className="h-16 rounded-2xl bg-text-primary text-text-primary text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <Calendar className="w-4 h-4 mr-2" />
                            Réserver
                        </Button>
                        <Button variant="outline" className="h-16 rounded-2xl border-border text-[10px] font-black uppercase tracking-widest">
                            <Send className="w-4 h-4 mr-2" />
                            Message
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        );
    }

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-[450px] bg-bg-secondary border-l border-border z-40 shadow-2xl overflow-auto elegant-scrollbar"
        >
            <div className="p-10 border-b border-border bg-text-primary text-text-primary relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-gold/20 to-transparent pointer-events-none" />
                
                <button 
                    onClick={() => setSelectedCRM(null)} 
                    className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-surface-card/10 flex items-center justify-center transition-all z-20"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="relative z-10">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-[2.5rem] bg-surface-card/10 flex items-center justify-center mb-8 border border-default shadow-2xl backdrop-blur-md"
                    >
                        <span className="text-4xl font-serif italic">
                            {getInitial(getFirstName(selectedCRM))}{getInitial(getLastName(selectedCRM))}
                        </span>
                    </motion.div>
                    <motion.h3 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-serif italic mb-4 tracking-tight leading-none"
                    >
                        {getFirstName(selectedCRM)} {getLastName(selectedCRM)}
                    </motion.h3>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-primary/40">
                            VIP • {(selectedCRM.id || '').slice(0, 8)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-10 space-y-10">
                <div className="grid grid-cols-3 gap-4">
                    {stats.map((st, i) => (
                        <div key={i} className="bg-bg-tertiary p-6 rounded-[2rem] text-center border border-border/40 hover:border-accent-gold/20 transition-all">
                            <p className={cn("text-2xl font-serif italic", st.gold ? "text-accent-gold" : "text-text-primary")}>{st.value}</p>
                            <p className="text-[7px] font-black text-text-muted/40 uppercase tracking-[0.2em] mt-1">{t(st.label) || st.label}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">{t('crm.contact_info') || 'INFOS CONTACT'}</p>
                    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-bg-tertiary border border-border/40 hover:border-accent-gold/20 transition-all group">
                        <Phone className="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold tracking-widest">{getPhone(selectedCRM)}</p>
                    </div>
                    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-bg-tertiary border border-border/40 hover:border-accent-gold/20 transition-all group">
                        <Mail className="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-bold uppercase tracking-widest">{getEmail(selectedCRM)}</p>
                    </div>
                </div>

                <div className="pt-6 grid grid-cols-1 gap-4">
                     <Button className="h-16 rounded-[2rem] bg-text-primary text-text-primary text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all">
                        {t('crm.book_reservation') || 'RÉSERVER MAINTENANT'}
                     </Button>
                </div>
            </div>
        </motion.div>
    );
}
