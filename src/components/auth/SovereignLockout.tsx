// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut, Terminal, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAtomValue } from "jotai";
import { tenantConfigAtom } from "@/store/fleetAtoms";

/**
 * 🔐 SovereignLockout - The Final Security Gate.
 * Triggered by the Suzerain (MCC) via killSwitch or license revocation.
 * Implements a premium, immersive "Lock" state for Grade VI compliance.
 */
export function SovereignLockout() {
    const { logout } = useAuth();
    const tenantConfig = useAtomValue(tenantConfigAtom);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] text-white overflow-hidden">
            {/* Background Cybernetic Decor */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-status-error/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-gold/10 blur-[120px] rounded-full" />
            </div>

            {/* Matrix-like overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-lg w-full p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl text-center"
            >
                {/* Status Indicator */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-status-error/20 blur-xl rounded-full"
                        />
                        <div className="relative bg-status-error/10 p-5 rounded-full border border-status-error/50">
                            <ShieldAlert className="w-12 h-12 text-status-error" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-4 tracking-tight">
                    COMMANDE SOUVERAINE : <span className="text-status-error">ACCÈS RÉVOQUÉ</span>
                </h1>
                
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Le Suzerain (Master Control Center) a suspendu l'exploitation technique de ce Vassal. 
                    Toutes les fonctions locales sont verrouillées pour garantir l'intégrité de l'Empire.
                </p>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase text-gray-500 mb-1 flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> Status
                        </div>
                        <div className="font-mono text-sm text-status-error">TERMINATED</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] uppercase text-gray-500 mb-1 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Tenant ID
                        </div>
                        <div className="font-mono text-sm text-primary-gold uppercase">{tenantConfig.id}</div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => logout()}
                    className="group relative w-full py-4 bg-white text-black font-bold rounded-2xl overflow-hidden active:scale-95 transition-all"
                >
                    <div className="absolute inset-0 bg-status-error translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2 group-hover:text-white transition-colors">
                        <LogOut className="w-5 h-5" />
                        DÉCONNEXION DE SESSION
                    </span>
                </button>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                        Protocol Nexus-Darwin 5.2.0-Grade VI
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
