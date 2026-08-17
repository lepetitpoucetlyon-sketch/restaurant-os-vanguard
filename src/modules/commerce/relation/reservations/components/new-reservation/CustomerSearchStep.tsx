"use client";

import { motion } from "framer-motion";
import { Search, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { Customer } from "@nexus/contracts";

interface CustomerSearchStepProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filteredCustomers: Customer[];
    selectedCustomer: Customer | null;
    setSelectedCustomer: (c: Customer) => void;
    setStep: (s: number) => void;
}

export function CustomerSearchStep({
    searchQuery,
    setSearchQuery,
    filteredCustomers,
    selectedCustomer,
    setSelectedCustomer,
    setStep,
}: CustomerSearchStepProps) {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
        >
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <Search className="w-4 h-4 text-accent" />
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Identification de l'Hôte</label>
                    </div>
                    <div className="relative group">
                        <Search strokeWidth={1.5} className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/30 group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            data-tutorial="reservations-0-0-1"
                            placeholder="RECHERCHER NOM, PRÉNOM OU TÉLÉPHONE..."
                            className="w-full h-20 bg-bg-secondary border border-border rounded-[2rem] pl-16 pr-8 text-lg font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Sélections Suggérées</span>
                        <button className="text-[10px] font-black text-accent uppercase tracking-[0.3em] hover:opacity-70 transition-opacity flex items-center gap-2">
                            Créer une Fiche <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {filteredCustomers.slice(0, 5).map((customer, idx) => (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={customer.id}
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setStep(2);
                                }}
                                className={cn(
                                    "group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden backdrop-blur-xl",
                                    selectedCustomer?.id === customer.id
                                        ? "bg-accent border-accent text-bg-primary shadow-2xl shadow-amber-500/20"
                                        : "bg-bg-secondary border-border hover:border-accent/30 hover:shadow-xl hover:bg-bg-tertiary shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center font-serif text-xl italic shadow-sm transition-all",
                                        selectedCustomer?.id === customer.id ? "bg-surface-card/10 text-bg-primary" : "bg-bg-tertiary text-text-primary"
                                    )}>
                                        {(customer.firstName || ' ').trim().charAt(0)}{(customer.lastName || ' ').trim().charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className={cn("text-xl font-serif italic", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-primary")}>
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className={cn("text-[10px] font-black tracking-widest", selectedCustomer?.id === customer.id ? "text-bg-primary/60" : "text-text-muted")}>
                                                {customer.phone}
                                            </p>
                                            <div className="w-1 h-1 rounded-full bg-accent" />
                                            <p className={cn("text-[10px] font-black tracking-widest uppercase", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted")}>
                                                {customer.visitCount} SÉJOURS
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className={cn("w-6 h-6 transition-all group-hover:translate-x-1", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted/30")} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
