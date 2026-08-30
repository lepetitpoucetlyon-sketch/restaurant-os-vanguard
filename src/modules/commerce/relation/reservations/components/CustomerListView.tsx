// @wip owner:commerce-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { useLanguage } from "@/shared/hooks";
import { cinematicContainer, cinematicItem } from '../constants';
import { useInfiniteScroll } from "@/shared/hooks/useVirtualization";

interface CustomerListViewProps {
    customers: import('@modules/commerce/relation/customers').CRM[];
    setSelectedCustomer: (customer: import('@modules/commerce/relation/customers').CRM) => void;
}

const BATCH = 20;

export function CustomerListView({
    customers,
    setSelectedCustomer
}: CustomerListViewProps) {
    const { t } = useLanguage();
    const [limit, setLimit] = useState(BATCH);
    const onLoadMore = useCallback(() => setLimit(l => l + BATCH), []);
    const { sentinelRef } = useInfiniteScroll({
        hasMore: limit < customers.length,
        loading: false,
        onLoadMore,
    });
    const visible = customers.slice(0, limit);

    return (
        <div className="p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="bg-bg-secondary p-8 rounded-full border border-border flex items-center justify-between gap-12 max-w-5xl mx-auto shadow-2xl">
                    <div className="relative flex-1">
                        <Search strokeWidth={1.5} className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                        <input 
                            type="text" 
                            placeholder={t('reservations.list.search_placeholder')} 
                            className="w-full bg-bg-primary border border-border rounded-full pl-16 pr-8 py-5 text-nano font-black uppercase tracking-[0.2em] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40" 
                        />
                    </div>
                    <div className="pr-4 border-l border-white/5 pl-10">
                        <p className="text-nano font-black text-text-primary/20 uppercase tracking-[0.4em] mb-1 italic">{t('reservations.list.registry')}</p>
                        <span className="text-sm font-mono font-bold text-accent">{customers.length} {t('reservations.list.profiles')}</span>
                    </div>
                </div>
                <motion.div variants={cinematicContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                    {visible.map(customer => (
                        <motion.div 
                            key={customer.id} 
                            variants={cinematicItem} 
                            onClick={() => setSelectedCustomer(customer)} 
                            whileHover={{ y: -10 }} 
                            className="bg-bg-secondary rounded-[3.5rem] p-12 group border border-border shadow-2xl hover:border-accent/40 cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex items-start gap-10 relative z-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-accent flex items-center justify-center text-3xl font-serif font-light text-bg-primary italic shadow-xl">
                                    {(customer.firstName || '').charAt(0)}{(customer.lastName || '').charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-3xl font-serif font-light text-text-primary italic truncate">{customer.firstName} {customer.lastName}</h3>
                                    <p className="text-[12px] font-mono font-bold text-text-muted/50 mt-3">{customer.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-12 pt-10 border-t border-border relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                                        <Star strokeWidth={2} className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono font-bold text-text-primary">{customer.visitCount}</p>
                                        <p className="text-nano font-black uppercase tracking-[0.3em] text-text-muted/50 mt-1 italic">{t('reservations.list.services')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-mono font-light text-accent italic">{Number(customer.totalSpent ?? 0).toFixed(0)}€</p>
                                    <p className="text-nano font-black uppercase tracking-[0.3em] text-text-muted/50 mt-1 italic">{t('reservations.list.value')}</p>
                                </div>
                            </div>
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/5 blur-[80px] rounded-full group-hover:bg-accent/10 transition-colors" />
                        </motion.div>
                    ))}
                </motion.div>
                <div ref={sentinelRef} />
            </div>
        </div>
    );
}
