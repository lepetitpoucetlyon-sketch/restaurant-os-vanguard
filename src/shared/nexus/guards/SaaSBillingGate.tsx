"use client";

import React from 'react';
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@ui/button";
import { useTenant } from "@/context/TenantContext";

interface SaaSBillingGateProps {
    children: React.ReactNode;
}

/**
 * SaaSBillingGate - Specialized security layer for SaaS compliance.
 * Blocks access ONLY if the active tenant status is 'suspended'.
 */
export function SaaSBillingGate({ children }: SaaSBillingGateProps) {
    const { activeTenantConfig } = useTenant();
    const pathname = usePathname();
    const router = useRouter();

    const isSuspended = activeTenantConfig?.status?.economy?.billingStatus === 'suspended';
    
    // EXCEPTION: Always allow access to Settings (to pay) and Admin (Master Console)
    const isSettingsArea = pathname?.startsWith('/settings');
    const isMccArea = pathname?.startsWith('/admin');

    if (isSuspended && !isSettingsArea && !isMccArea) {
        return (
            <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center p-6 overflow-hidden">
                <div className="absolute inset-0 bg-red-600/5 blur-[120px] rounded-full -mt-40 -ml-40" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-xl bg-[#0B0B0C] border border-red-500/20 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl"
                >
                    <div className="w-20 h-20 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/20">
                        <Lock size={36} />
                    </div>
                    <h2 className="text-4xl font-serif italic text-white uppercase tracking-tighter mb-4">Accès Suspendu</h2>
                    <p className="text-sm text-neutral-500 uppercase tracking-widest font-bold mb-8">Solvabilité SaaS Non Conforme</p>
                    
                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-2xl mb-10">
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            L'abonnement de l'instance <span className="text-white font-black">{activeTenantConfig?.metadata?.name}</span> est suspendu suite à un incident de facturation.
                        </p>
                    </div>

                    <Button 
                        onClick={() => router.push('/settings?tab=subscription')}
                        className="w-full py-8 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                    >
                        <CreditCard size={18} className="mr-2" />
                        Régulariser la Situation
                    </Button>

                    <p className="mt-8 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.4em]">Finances Integrity Protected</p>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
