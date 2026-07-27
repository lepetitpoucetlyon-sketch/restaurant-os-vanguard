"use client";

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from "@/shared/hooks";
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';

/**
 * 🛰️ Logout Recovery Page - Restaurant OS
 * Handles system resets after a Shadow Drift block or manual logout.
 */
export default function LogoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { logout } = useAuth();
    const reason = searchParams.get('reason');

    const handleHeal = async () => {
        try {
            // Attempt to force-unlock if we have access to MasterBridge
            const { MasterBridge } = await import('@/lib/MasterBridge');
            await MasterBridge.pushGlobalConfig({
                maintenanceMode: false,
                killSwitch: false,
                securityLevel: 'standard',
                globalMessage: 'Session terminée avec succès.',
                allowedFeatures: []
            });
        } catch (_e) {
            console.warn('[RESCUE] Master override failed, but session will be cleared locally.');
        }
    };

    useEffect(() => {
        // Atomic cleanup
        logout();
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }
    }, [logout]);

    const handleReset = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-surface-sidebar flex items-center justify-center p-6 text-white font-mono">
            <div className="max-w-xl w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-2 border-red-900 bg-zinc-950 p-8 rounded-xl shadow-[0_0_50px_rgba(153,0,0,0.2)]"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-status-danger/20 rounded-lg">
                            <ShieldAlert className="w-8 h-8 text-status-danger" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">Sovereignty_Barrier_Active</h1>
                            <p className="text-secondary text-xs mt-1 font-sans">PROTOCOL_EXCALIBUR_RECOVERY_MODE</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-surface-sidebar/50 border border-default rounded-lg">
                            <p className="text-sm text-muted leading-relaxed font-sans">
                                {reason === 'shadow_drift_block' 
                                    ? "Un écart de contexte a été détecté par le SovereignGuard. Par mesure de sécurité, toutes les sessions actives ont été terminées pour protéger l'intégrité de la structure Grade VI."
                                    : "Votre session a été fermée avec succès. L'accès sécurisé a été réinitialisé."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={async () => {
                                    await handleHeal();
                                    handleReset();
                                }}
                                className="w-full h-14 bg-status-danger hover:bg-status-danger text-white font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 rounded-lg"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Réinitialiser le Système
                            </button>
                            
                            <button 
                                onClick={() => router.push('/')}
                                className="w-full h-14 border border-default hover:bg-surface-sidebar text-muted font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-lg"
                            >
                                <Home className="w-5 h-5" />
                                Retour à l'accueil
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] text-primary uppercase">System_Status</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-3 h-1 bg-status-danger/30 overflow-hidden">
                                        <motion.div 
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-full h-full bg-status-danger"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-primary italic">EXCALIBUR_9_BIOLOGIQUE_ACTIVE</p>
                            <p className="text-[10px] text-primary">grade_vi_lockdown_v5.4</p>
                        </div>
                    </div>
                </motion.div>

                <p className="text-center mt-8 text-status-danger/40 text-[10px] uppercase tracking-[0.5em] font-bold">
                    [ Access_Denied_Structure_Immutable ]
                </p>
            </div>
        </div>
    );
}
