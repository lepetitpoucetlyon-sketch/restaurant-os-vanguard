"use client";

import { motion } from "framer-motion";
import { Customer } from "@nexus/contracts";
import { Button } from "@ui/button";
import { ScrollArea } from "@ui/scroll-area";
import { Phone, Mail, Star, Calendar } from "lucide-react";

interface CustomerDetailPanelProps {
    customer: Customer;
    onClose: () => void;
    onNewReservation: () => void;
}

export function CustomerDetailPanel({
    customer,
    onClose,
    onNewReservation,
}: CustomerDetailPanelProps) {
    return (
        <div
            className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-8 animate-in fade-in duration-500"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.6)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#121212] p-6 md:p-10 relative overflow-hidden text-white border-b border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-surface-card/5 backdrop-blur-md border border-subtle flex items-center justify-center text-2xl md:text-4xl font-serif font-light italic shadow-2xl text-accent">
                            {(customer.firstName || '').charAt(0)}
                            {(customer.lastName || '').charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">
                                Profil Client Executive Intelligence
                            </p>
                            <h2 className="text-2xl md:text-4xl font-serif font-light tracking-tight italic">
                                {customer.firstName} {customer.lastName}
                            </h2>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-4 md:mt-6">
                                {customer.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-accent text-bg-primary shadow-lg shadow-amber-500/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>

                <ScrollArea className="flex-1 elegant-scrollbar bg-bg-primary">
                    <div className="flex flex-col">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 border-b border-white/5 bg-bg-primary">
                            <div className="p-10 text-center border-r border-white/5">
                                <p className="text-3xl font-mono font-light text-accent italic">
                                    {customer.visitCount}
                                </p>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">
                                    Passages
                                </p>
                            </div>
                            <div className="p-10 text-center border-r border-white/5">
                                <p className="text-3xl font-mono font-light text-white italic">
                                    {((Number(customer.totalSpentInCents || 0)) / 100).toFixed(0)}€
                                </p>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">
                                    CA Réalisé
                                </p>
                            </div>
                            <div className="p-10 text-center">
                                <p className="text-3xl font-mono font-light text-white italic">
                                    {((Number(customer.averageSpendInCents || 0)) / 100).toFixed(0)}€
                                </p>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">
                                    Engagement
                                </p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="p-10 space-y-12">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">
                                        Ligne Directe
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                            <Phone strokeWidth={1.5} className="w-5 h-5 text-accent" />
                                        </div>
                                        <span className="text-base font-mono font-bold text-white tracking-tight">
                                            {customer.phone}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">
                                        Canal Privilégié
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                            <Mail strokeWidth={1.5} className="w-5 h-5 text-accent" />
                                        </div>
                                        <span className="text-base font-bold text-white truncate italic">
                                            {customer.email || "Non renseigné"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div>
                                <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                    <Star strokeWidth={2} className="w-4 h-4 text-accent" />
                                    ANALYSE DES HABITUDES & PRÉFÉRENCES
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {customer.preferences.map((pref, i) => (
                                        <span
                                            key={i}
                                            className="px-6 py-3 bg-surface-card/5 rounded-2xl text-[12px] font-bold text-white border border-subtle shadow-sm italic group-hover:border-accent/40 transition-all"
                                        >
                                            {pref}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-10 border-t border-white/5 bg-bg-primary flex gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white border border-subtle transition-all"
                    >
                        Fermer le Profil
                    </Button>
                    <Button
                        onClick={onNewReservation}
                        className="flex-1 h-16 bg-accent hover:bg-surface-card text-bg-primary rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-500/10 transition-all flex items-center justify-center gap-4"
                    >
                        <Calendar strokeWidth={1.5} className="w-5 h-5" />
                        Programmer une Nouvelle Table
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
