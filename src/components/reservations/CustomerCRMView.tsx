"use client";

import { motion, Variants } from "framer-motion";
import { Search, Star } from "lucide-react";
import { Customer } from "@/types";
import { easing } from "@/lib/motion";

const cinematicContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const cinematicItem: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: easing.easeOutExpo },
    },
};

// Safe accessors for customer data that may come in different formats
const getFirstName = (c: any): string => c?.firstName || (c?.name ? c.name.split(' ')[0] : '') || '';
const getLastName = (c: any): string => c?.lastName || (c?.name ? c.name.split(' ').slice(1).join(' ') : '') || '';
const getInitial = (s: string): string => (s && s.length > 0 ? s.charAt(0) : '?');
const getVisitCount = (c: any): number => c?.visitCount ?? c?.totalVisits ?? 0;
const getTotalSpent = (c: any): number => c?.totalSpent ?? 0;

interface CustomerCRMViewProps {
    customers: Customer[];
    onCustomerClick: (customer: Customer) => void;
}

export function CustomerCRMView({ customers, onCustomerClick }: CustomerCRMViewProps) {
    return (
        <div className="flex-1 w-full bg-bg-primary p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Search & Filters Linear Bar */}
                <div className="bg-bg-secondary p-8 rounded-full border border-border shadow-2xl flex items-center justify-between gap-12 max-w-5xl mx-auto">
                    <div className="relative flex-1">
                        <Search
                            strokeWidth={1.5}
                            className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted"
                        />
                        <input
                            type="text"
                            placeholder="IDENTIFICATION DU CONVIVE (NOM, MOBILE)..."
                            className="w-full bg-bg-primary border border-border rounded-full pl-16 pr-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-10 pr-4">
                        <div className="h-10 w-px bg-white/5" />
                        <div>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 italic">
                                REGISTRE
                            </p>
                            <span className="text-sm font-mono font-bold text-accent">
                                {customers.length} PROFILS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Customer Grid - Luxury Cards */}
                <motion.div
                    variants={cinematicContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12"
                >
                    {customers.map((customer) => (
                        <motion.div
                            key={customer.id}
                            variants={cinematicItem}
                            onClick={() => onCustomerClick(customer)}
                            whileHover={{ y: -10, transition: { duration: 0.4 } }}
                            className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[3.5rem] p-12 group relative overflow-hidden transition-all duration-700 border border-white/20 dark:border-white/5 shadow-2xl hover:border-accent/40 hover:shadow-accent/5 cursor-pointer"
                        >
                            <div className="flex items-start gap-10 relative z-10">
                                <motion.div
                                    whileHover={{ rotate: 5, scale: 1.1 }}
                                    className="w-20 h-20 rounded-[2rem] bg-accent flex items-center justify-center text-3xl font-serif font-light text-bg-primary italic group-hover:bg-white transition-all duration-500 shadow-xl shadow-amber-500/10"
                                >
                                    {getInitial(getFirstName(customer))}
                                    {getInitial(getLastName(customer))}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-3xl font-serif font-light text-text-primary tracking-tight italic group-hover:text-accent transition-colors truncate leading-tight">
                                        {getFirstName(customer)} {getLastName(customer)}
                                    </h3>
                                    <p className="text-[12px] font-mono font-bold text-text-muted/50 mt-3 tracking-tighter">
                                        {customer.phone || ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-12 pt-10 border-t border-border relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border group-hover:border-accent/40 transition-colors">
                                        <Star strokeWidth={2} className="w-4 h-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono font-bold text-text-primary leading-none">
                                            {getVisitCount(customer)}
                                        </p>
                                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted/50 mt-1 italic">
                                            Services
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-mono font-light text-accent italic tracking-tighter">
                                        {getTotalSpent(customer).toFixed(0)}€
                                    </p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted/50 mt-1 italic">
                                        Valeur Totale
                                    </p>
                                </div>
                            </div>

                            {/* Subtle Ambient Glow */}
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/5 blur-[80px] rounded-full group-hover:bg-accent/10 transition-colors duration-700" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
