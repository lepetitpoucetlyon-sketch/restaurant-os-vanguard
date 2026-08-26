"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Zap, Globe, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ProvisioningEngine } from '@/lib/ProvisioningEngine';
import { ProvisioningDNA } from '@/shared/types/empire';
import { Button } from '@ui/Button';

interface ProvisioningWizardProps {
    onClose: () => void;
    onSuccess: (newInstance: import('@/shared/nexus-contract').SovereignData) => void;
}


type Step = 'identity' | 'config' | 'deploying';

export function ProvisioningWizard({ onClose, onSuccess }: ProvisioningWizardProps) {
    const [step, setStep] = useState<Step>('identity');
    const [_isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProvisioningDNA>({
        name: '',
        key: '',
        ownerEmail: 'admin@empire.com',
        initialPrimaryColor: '#C5A059',
        tier: 'STANDARD',
        copyBaseTemplates: true
    });

    const handleIdentitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.length < 3) return setError("Le nom est trop court.");
        if (!/^[a-z0-9-]+$/.test(formData.key)) return setError("Clé invalide (minuscules/tirets uniquement).");
        setError(null);
        setStep('config');
    };

    const handleLaunch = async () => {
        setIsLoading(true);
        setStep('deploying');
        try {
            const newInstance = await ProvisioningEngine.provisionNewInstance(formData);
            onSuccess(newInstance);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown Deployment Error';
            setError(message);
            setStep('identity');
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-surface-card border border-border rounded-[3rem] p-12 relative overflow-hidden shadow-2xl"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors">
                    <X size={24} />
                </button>

                <AnimatePresence mode="wait">
                    {step === 'identity' && (
                        <motion.div 
                            key="identity"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-text-primary text-bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                                    <Rocket size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-serif text-text-primary uppercase italic tracking-tight">Provisioning Target</h2>
                                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Identité du nouveau nœud</p>
                                </div>
                            </div>

                            <form onSubmit={handleIdentitySubmit} className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-secondary uppercase tracking-widest">Nom du Restaurant</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="EX: LE PETIT POUCET"
                                        className="w-full bg-surface-glass border border-white/5 rounded-2xl p-6 text-text-primary focus:outline-none focus:border-action-primary/50 transition-all font-serif italic text-lg"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-secondary uppercase tracking-widest">Clé Technique (ID Unique)</label>
                                    <input 
                                        type="text" 
                                        value={formData.key}
                                        onChange={(e) => setFormData({...formData, key: e.target.value.toLowerCase()})}
                                        placeholder="ex: le-petit-poucet-lyon"
                                        className="w-full bg-surface-glass border border-white/5 rounded-2xl p-6 text-text-primary focus:outline-none focus:border-action-primary/50 transition-all font-mono text-sm"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-status-danger text-chip-label">
                                        <AlertCircle size={14} /> {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full py-8 text-micro font-black uppercase tracking-[0.3em] bg-white text-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                                    Passer à la Configuration Infrastructure
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'config' && (
                        <motion.div 
                            key="config"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-action-primary text-bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                                    <Zap size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-serif text-text-primary uppercase italic tracking-tight">System Specs</h2>
                                    <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Puissance & Géo-localité</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-secondary uppercase tracking-widest">Tier de Service</label>
                                    <select 
                                        value={formData.tier}
                                        onChange={(e) => setFormData({...formData, tier: e.target.value as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'})}
                                        className="w-full bg-surface-glass border border-white/5 rounded-2xl p-6 text-text-primary focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="STANDARD">Standard Node</option>
                                        <option value="PREMIUM">Premium Pro</option>
                                        <option value="ENTERPRISE">Enterprise OS</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-secondary uppercase tracking-widest">Accent Branding</label>
                                    <div className="flex items-center gap-4 bg-surface-glass border border-white/5 rounded-2xl p-4">
                                        <input 
                                            type="color" 
                                            value={formData.initialPrimaryColor}
                                            onChange={(e) => setFormData({...formData, initialPrimaryColor: e.target.value})}
                                            className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                                        />
                                        <span className="text-sm font-mono text-text-primary">{formData.initialPrimaryColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-status-info/5 border border-blue-500/10 rounded-3xl flex items-start gap-4">
                                <Globe className="text-blue-500 shrink-0 mt-1" size={20} />
                                <div className="space-y-1">
                                    <p className="text-nano font-black text-blue-500 uppercase tracking-widest leading-none">Global Deployment</p>
                                    <p className="text-xs text-blue-500/60">L'instance sera propagée sur la région <span className="font-bold">europe-west9 (Paris)</span> avec isolation de base de données 100% dédiée.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={() => setStep('identity')} variant="ghost" className="flex-1 py-8 text-micro font-black border border-white/5 uppercase tracking-widest">Retour</Button>
                                <Button onClick={handleLaunch} className="flex-[2] py-8 bg-action-primary text-bg-primary text-micro font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] shadow-xl shadow-amber-500/20">Lancer le Déploiement</Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'deploying' && (
                        <motion.div 
                            key="deploying"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-12 space-y-8 text-center"
                        >
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-action-primary/20 flex items-center justify-center">
                                    <Loader2 className="w-16 h-16 text-action-primary animate-spin" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-action-primary rounded-xl flex items-center justify-center animate-pulse-soft shadow-2xl">
                                    <Rocket size={20} className="text-bg-primary" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-4xl font-serif text-text-primary uppercase italic tracking-tighter animate-pulse">Neural Expansion...</h3>
                                <p className="text-xs text-text-muted uppercase tracking-[0.4em] font-bold">Allocating Cloud Resources & Generating Twins</p>
                            </div>

                            <div className="w-full max-w-sm space-y-4 pt-8">
                                <div className="flex items-center gap-3 text-status-success/60 text-chip-label-sm">
                                    <CheckCircle2 size={12} /> Firebase Node ID: ros-{formData.key}
                                </div>
                                <div className="flex items-center gap-3 text-status-success/60 text-chip-label-sm">
                                    <CheckCircle2 size={12} /> DNS Routing Table: {formData.key}.restaurant-os.app
                                </div>
                                <div className="flex items-center gap-3 text-status-success text-chip-label-sm animate-breath">
                                    <Loader2 size={12} className="animate-spin" /> Sealing Fiscal Chains (Audit Ready)
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
