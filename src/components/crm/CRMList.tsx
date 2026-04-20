// @ts-nocheck
// @ts-nocheck
"use client";

import React from 'react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { 
    crmSearchQueryAtom, 
    crmFilterSegmentAtom,
    crmSelectedCustomerAtom
} from '@/store/crmAtoms';
import { customersAtom } from '@/store/operationalAtoms';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/ui.foundations';
import { Customer } from '@/types';

// Helper functions (extracted from page.tsx logic)
const getFirstName = (c: any): string => c?.firstName || (c?.name ? c.name.split(' ')[0] : '') || '';
const getLastName = (c: any): string => c?.lastName || (c?.name ? c.name.split(' ').slice(1).join(' ') : '') || '';
const getInitial = (s: string): string => (s && s.length > 0 ? s[0] : '?');
const getVisitCount = (c: any): number => c?.visitCount ?? c?.totalVisits ?? 0;
const getPhone = (c: any): string => c?.phone ?? '';
const getEmail = (c: any): string => c?.email ?? '';

export function CRMList() {
    const { t } = useLanguage();
    const [searchQuery] = useAtom(crmSearchQueryAtom);
    const [filterSegment] = useAtom(crmFilterSegmentAtom);
    const [customers] = useAtom(customersAtom);
    const [, setSelectedCustomer] = useAtom(crmSelectedCustomerAtom);

    const filteredCustomers = customers.filter(c => {
        const cName = (c as any).name || `${getFirstName(c)} ${getLastName(c)}`;
        const cEmail = getEmail(c);
        const cPhone = getPhone(c);
        
        if (filterSegment && (c as any).segment !== filterSegment) return false;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                cName.toLowerCase().includes(query) ||
                cEmail.toLowerCase().includes(query) ||
                cPhone.includes(query)
            );
        }
        return true;
    });

    if (filteredCustomers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-6">
                    <span className="font-serif italic text-4xl">?</span>
                </div>
                <p className="font-black text-[10px] uppercase tracking-widest">{t('crm.no_results') || 'Aucun client trouvé'}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {filteredCustomers.map((customer, i) => (
                <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="bg-white dark:bg-bg-secondary p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] flex items-center justify-between group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all border border-neutral-100 dark:border-border/50 h-28 md:h-36 relative overflow-hidden"
                    onClick={() => setSelectedCustomer(customer)}
                >
                    {/* Subtle aesthetic backdrop */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-accent-gold/10 transition-colors" />

                    <div className="flex items-center gap-4 md:gap-8 relative z-10">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-bg-tertiary flex items-center justify-center border border-border shadow-inner group-hover:border-accent-gold/30 transition-colors">
                                <span className="text-text-primary font-serif italic text-xl md:text-3xl">
                                    {getInitial(getFirstName(customer))}{getInitial(getLastName(customer))}
                                </span>
                            </div>
                            <div className="absolute top-0 right-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#3B82F6] border-[2px] md:border-[3px] border-white dark:border-bg-secondary" />
                        </div>
                        <div className="space-y-1 md:space-y-3">
                            <h3 className="text-xl md:text-4xl font-serif text-text-primary italic tracking-tight leading-none group-hover:text-accent-gold transition-colors">
                                {getInitial(getFirstName(customer))}. {getLastName(customer)}
                            </h3>
                            <span className="inline-flex px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-bg-tertiary text-text-muted/60">
                                {t(`crm.segments.${(customer as any).segment || 'new'}`) || (customer as any).segment || 'Nouveau'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 md:gap-12 mr-2 md:mr-8 text-right relative z-10">
                        <div className="hidden sm:block">
                            <p className="text-[7px] md:text-[9px] font-black text-text-muted/40 uppercase tracking-widest">VISITES</p>
                            <p className="text-lg md:text-3xl font-serif italic text-text-primary">{getVisitCount(customer)}</p>
                        </div>
                        <div>
                            <p className="text-[7px] md:text-[9px] font-black text-text-muted/40 uppercase tracking-widest">TOTAL</p>
                            <p className="text-lg md:text-3xl font-serif italic text-accent-gold">
                                {((customer.totalSpentInCents || 0) / 100).toFixed(0)}€
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
