"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
    Info, 
    Phone, 
    Mail, 
    Star, 
    Calendar 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Customer, Reservation } from "@/types";

interface CustomerDetailPanelProps {
    customer: Customer;
    getCustomerHistory: (id: string) => Reservation[];
    setSelectedCustomer: (val: Customer | null) => void;

    setIsNewReservationModalOpen: (val: boolean) => void;
}

export function CustomerDetailPanel({
    customer,
    getCustomerHistory,
    setSelectedCustomer,
    setIsNewReservationModalOpen
}: CustomerDetailPanelProps) {
    const { t } = useLanguage();
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-8 animate-in fade-in duration-500" onClick={() => setSelectedCustomer(null)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.2)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-border"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-bg-secondary p-6 md:p-10 relative overflow-hidden text-text-primary border-b border-border">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-bg-tertiary backdrop-blur-md border border-border flex items-center justify-center text-2xl md:text-4xl font-serif font-light italic shadow-xl text-accent">
                            {(customer.firstName || '').charAt(0)}{(customer.lastName || '').charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-2">{t('reservations.customer.executive_intelligence')}</p>
                            <h2 className="text-2xl md:text-4xl font-serif font-light tracking-tight italic">{customer.firstName} {customer.lastName}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-4 md:mt-6">
                                {customer.tags.map(tag => (
                                    <span key={tag} className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-accent text-bg-primary shadow-lg shadow-amber-500/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 elegant-scrollbar">
                    <div className="p-10 space-y-12">
                        {/* Stats Hub */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="bg-bg-secondary rounded-[2rem] p-6 border border-border shadow-sm">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('reservations.customer.total_spent')}</p>
                                <p className="text-2xl font-mono font-light text-accent italic">{customer.totalSpent.toFixed(2)}€</p>
                            </div>
                            <div className="bg-bg-secondary rounded-[2rem] p-6 border border-border shadow-sm">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('reservations.customer.visits')}</p>
                                <p className="text-2xl font-mono font-light text-accent italic">{customer.visitCount}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-[2rem] p-6 border border-border shadow-sm">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('reservations.customer.last_visit')}</p>
                                <p className="text-sm font-mono font-bold text-accent">{customer.lastVisit}</p>
                            </div>
                        </div>

                        {/* Contact & Preferences Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                    <Info className="w-4 h-4 text-accent" />
                                    {t('reservations.customer.contact')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center text-text-muted group-hover:text-accent group-hover:bg-accent/10 transition-all">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-mono font-bold text-text-primary/70">{customer.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center text-text-muted group-hover:text-accent group-hover:bg-accent/10 transition-all">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-mono font-bold text-text-primary/70">{customer.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                    <Star className="w-4 h-4 text-accent" />
                                    {t('reservations.customer.preferences')}
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {customer.preferences.map((pref, i) => (
                                        <span key={i} className="px-6 py-3 bg-bg-tertiary rounded-2xl text-[12px] font-bold text-text-primary border border-border shadow-sm italic hover:border-accent transition-all">
                                            {pref}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-10 border-t border-border bg-bg-secondary flex gap-6">
                    <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary border border-border transition-all">
                        {t('reservations.customer.close')}
                    </Button>
                    <Button
                        onClick={() => {
                            setIsNewReservationModalOpen(true);
                            setSelectedCustomer(null);
                        }}
                        className="flex-1 h-16 bg-accent hover:bg-white text-bg-primary rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-500/10 transition-all flex items-center justify-center gap-4"
                    >
                        <Calendar strokeWidth={1.5} className="w-5 h-5" />
                        {t('reservations.customer.new_table')}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
