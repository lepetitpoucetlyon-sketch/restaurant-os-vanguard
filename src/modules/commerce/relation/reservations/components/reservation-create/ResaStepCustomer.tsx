"use client";

import { Search, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { Customer } from "@nexus/contracts";

interface ResaStepCustomerProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    filteredCustomers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (c: Customer) => void;
}

export function ResaStepCustomer({
    searchQuery,
    onSearchChange,
    filteredCustomers,
    selectedCustomer,
    onSelectCustomer,
}: ResaStepCustomerProps) {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="space-y-8"
        >
            <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-accent" />
                    Identification du client
                </label>
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Nom, prénom ou téléphone…"
                        className="w-full h-16 bg-bg-secondary border border-border rounded-[1.5rem] pl-14 pr-6 text-base font-serif italic text-text-primary focus:outline-none focus:border-accent/40 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {filteredCustomers.slice(0, 6).map((customer, idx) => (
                    <motion.button
                        key={customer.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => onSelectCustomer(customer)}
                        className={cn(
                            "w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300",
                            selectedCustomer?.id === customer.id
                                ? "bg-accent border-accent text-bg-primary shadow-xl shadow-amber-500/15"
                                : "bg-bg-secondary border-border hover:border-accent/30 hover:shadow-lg hover:bg-bg-tertiary"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg italic shadow-sm",
                                selectedCustomer?.id === customer.id ? "bg-surface-card/10 text-bg-primary" : "bg-bg-tertiary text-text-primary"
                            )}>
                                {(customer.firstName || " ").charAt(0)}{(customer.lastName || " ").charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className={cn("text-lg font-serif italic", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-primary")}>
                                    {customer.firstName} {customer.lastName}
                                </p>
                                <p className={cn("text-[10px] font-black tracking-widest", selectedCustomer?.id === customer.id ? "text-bg-primary/60" : "text-text-muted")}>
                                    {customer.phone} · {customer.visitCount ?? 0} séjours
                                </p>
                            </div>
                        </div>
                        <ChevronRight className={cn("w-5 h-5", selectedCustomer?.id === customer.id ? "text-bg-primary" : "text-text-muted/30")} />
                    </motion.button>
                ))}
                {filteredCustomers.length === 0 && (
                    <p className="text-center text-[11px] text-text-muted uppercase tracking-widest py-8">
                        Aucun client trouvé
                    </p>
                )}
            </div>
        </motion.div>
    );
}
