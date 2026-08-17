"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Customer } from "@nexus/contracts";
import { Button } from "@ui/button";
import { ScrollArea } from "@ui/scroll-area";
import { Calendar } from "lucide-react";
import { LoyaltyCard } from '../../../acquisition/marketing/components/crm/LoyaltyCard';

import { CustomerDetailHeader, type DetailTab } from "./detail-panel/CustomerDetailHeader";
import { CustomerProfileTab } from "./detail-panel/CustomerProfileTab";
import { CustomerHistoriqueTab } from "./detail-panel/CustomerHistoriqueTab";

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
    const [activeTab, setActiveTab] = useState<DetailTab>("profil");

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
                <CustomerDetailHeader
                    customer={customer}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                <ScrollArea className="flex-1 elegant-scrollbar bg-bg-primary">
                    {activeTab === "profil" && <CustomerProfileTab customer={customer} />}
                    {activeTab === "historique" && <CustomerHistoriqueTab customer={customer} />}
                    {activeTab === "fidelite" && (
                        <div className="p-8">
                            <LoyaltyCard customerId={customer.id} customerName={`${customer.firstName} ${customer.lastName}`} />
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="p-10 border-t border-white/5 bg-bg-primary flex gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-16 px-10 rounded-full text-[10px] font-black uppercase tracking-widest text-text-primary/40 hover:text-text-primary border border-subtle transition-all"
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
