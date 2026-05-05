"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks";
import { useSettings } from "@/context/SettingsContext";
import { 
    Smartphone, 
    Mail, 
    ShieldCheck, 
    ArrowRight, 
    RefreshCcw, 
    AlertCircle,
    CheckCircle2,
    Key,
    Lock
} from "lucide-react";
import { Button } from "@ui/button";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@ui/Toast";

export function TwoFactorChallenge() {
    const { currentUser, verifyTwoFactor, logout } = useAuth();
    const { settings } = useSettings();
    const { showToast } = useToast();
    
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRescueOptions, setShowRescueOptions] = useState(false);
    const [method, setMethod] = useState<'sms' | 'email'>('sms');
    const [activePhoneIndex, setActivePhoneIndex] = useState(0);

    const phones = currentUser?.phones || [];
    const currentPhone = phones[activePhoneIndex] || "Numéro inconnu";

    const handleSubmit = async () => {
        if (code.length < 6) return;
        setIsLoading(true);
        try {
            const success = await verifyTwoFactor(code);
            if (!success) {
                showToast("Code de vérification invalide", "error");
                setCode("");
            }
        } catch (error) {
            showToast("Erreur lors de la vérification", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-submit when 6 digits are reached
    useEffect(() => {
        if (code.length === 6) {
            handleSubmit();
        }
    }, [code]);

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -ml-48 -mb-48" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full bg-bg-secondary border border-border rounded-[3rem] p-10 shadow-premium relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <ShieldCheck strokeWidth={1.5} className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">Double <span className="text-accent not-italic">Vérification</span></h2>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mt-2">Protocole de sécurité Multi-Gènes</p>
                </div>

                <AnimatePresence mode="wait">
                    {!showRescueOptions ? (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl font-serif text-text-primary mb-2"
                            >
                                Vérification requise
                            </motion.h3>
                            <div className="bg-bg-tertiary/50 border border-border rounded-2xl p-6 text-center">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    {method === 'sms' ? (
                                        <Smartphone className="w-4 h-4 text-accent" />
                                    ) : (
                                        <Mail className="w-4 h-4 text-accent" />
                                    )}
                                    <span className="text-[11px] font-bold text-text-primary uppercase tracking-widest">
                                        {method === 'sms' ? "Code envoyé par SMS" : "Code envoyé par Email"}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-text-muted">
                                    {method === 'sms' ? currentPhone : currentUser?.rescueEmail}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div 
                                            key={i}
                                            className={cn(
                                                "w-12 h-16 bg-bg-tertiary border-2 flex items-center justify-center rounded-xl text-2xl font-mono font-bold transition-all",
                                                code.length === i ? "border-accent ring-2 ring-accent/10" : "border-transparent",
                                                code.length > i ? "text-text-primary" : "text-text-muted/20"
                                            )}
                                        >
                                            {code[i] || "•"}
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="text"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                    className="sr-only"
                                />
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <button 
                                    onClick={() => setShowRescueOptions(true)}
                                    className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-accent/80 transition-colors"
                                >
                                    Méthodes de secours
                                </button>
                                <button 
                                    onClick={logout}
                                    className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest hover:text-text-muted transition-colors"
                                >
                                    Se déconnecter
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="rescue"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h4 className="text-[11px] font-black text-text-primary uppercase tracking-widest mb-4">Canaux Emergences</h4>
                            
                            <div className="space-y-3">
                                {phones.map((p: string, idx: number) => (
                                    <button 
                                        key={idx}
                                        onClick={() => {
                                            setActivePhoneIndex(idx);
                                            setMethod('sms');
                                            setShowRescueOptions(false);
                                            showToast("SMS renvoyé sur le numéro secondaire", "info");
                                        }}
                                        className="w-full flex items-center gap-4 p-4 bg-bg-tertiary rounded-xl border border-transparent hover:border-accent transition-all group"
                                    >
                                        <Smartphone className="w-5 h-5 text-text-muted group-hover:text-accent" />
                                        <div className="text-left">
                                            <p className="text-[11px] font-bold text-text-primary">Numéro de secours {idx + 1}</p>
                                            <p className="text-[10px] text-text-muted">{p}</p>
                                        </div>
                                    </button>
                                ))}

                                {currentUser?.rescueEmail && settings.securityConfig?.allowEmailRescue && (
                                    <button 
                                        onClick={() => {
                                            setMethod('email');
                                            setShowRescueOptions(false);
                                            showToast("Code de secours envoyé par Email", "info");
                                        }}
                                        className="w-full flex items-center gap-4 p-4 bg-bg-tertiary rounded-xl border border-transparent hover:border-accent transition-all group"
                                    >
                                        <Mail className="w-5 h-5 text-text-muted group-hover:text-accent" />
                                        <div className="text-left">
                                            <p className="text-[11px] font-bold text-text-primary">Email de secours</p>
                                            <p className="text-[10px] text-text-muted">{currentUser.rescueEmail}</p>
                                        </div>
                                    </button>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowRescueOptions(false)}
                                className="w-full py-4 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-primary transition-colors"
                            >
                                Retour
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
