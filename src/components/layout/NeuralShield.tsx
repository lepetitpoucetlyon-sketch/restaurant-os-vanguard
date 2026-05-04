'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, Send, X, ShieldAlert, Cpu, Activity, Info, Zap } from 'lucide-react';
import { MaintenanceAgent } from '@domain/services/MaintenanceAgent';
import { useAuth } from '@/hooks';
import { usePathname } from 'next/navigation';
import { useToast } from '@ui/Toast';
import { cn } from '@/lib/utils';

export function NeuralShield() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [description, setDescription] = useState('');
    const [issueType, setIssueType] = useState<'CRITICAL_BUG' | 'UI_GLITCH' | 'DATA_INCONSISTENCY' | 'PERFORMANCE'>('CRITICAL_BUG');

    const { currentUser } = useAuth();
    const pathname = usePathname();
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!description.trim()) return;
        
        setIsSubmitting(true);
        try {
            // Collecte de l'état "Snapshot" de haute précision (Audit 'Très Bien')
            const systemState = {
                currentRoute: pathname,
                orderCount: 0,
                inventoryStatus: 'Online',
                offlineMode: !window.navigator.onLine,
                screenResolution: `${window.innerWidth}x${window.innerHeight}`,
                pixelRatio: window.devicePixelRatio,
                language: navigator.language,
                userAgent: navigator.userAgent,
                lastActions: ['Navigation to ' + pathname, 'SOS Modal Opened'],
            };

            const hostname = window.location.hostname;
            const subdomain = hostname.includes('.') ? hostname.split('.')[0] : 'master';
            const resolvedTenant = (subdomain && !['admin', 'master', 'www', 'localhost'].includes(subdomain)) 
              ? subdomain 
              : 'main';

            const ticketId = await MaintenanceAgent.submitSOS({
                tenantId: resolvedTenant,
                userId: currentUser?.id || 'SOVEREIGN_ANONYMOUS',

                type: issueType,
                description,
                systemState,
                logs: [
                    `[SYSTEM] SOS Triggered: ${new Date().toISOString()}`,
                    `[NETWORK] Online: ${window.navigator.onLine}`,
                    `[UI] Route: ${pathname}`,
                    `[CLIENT] User: ${currentUser?.name || 'Anonymous'} (${currentUser?.id || 'no-id'})`
                ]
            });

            showToast({
                title: '🆘 SOS ENVOYÉ',
                description: `Ticket #${ticketId.slice(-6)} reçu par le MCC. L'IA analyse votre problème.`,
                type: 'success'
            });

            setIsOpen(false);
            setDescription('');
        } catch (error) {
            showToast({
                title: 'Erreur',
                description: "Échec de l'envoi du SOS. Réessayez ou contactez le support.",
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* SOS Trigger Button (Sticky Floating or Sidebar Item) */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center border-2 border-white/20 hover:bg-red-700 transition-colors group"
            >
                <ShieldAlert className="w-7 h-7 group-hover:animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                </span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0A0A0A] border border-red-900/50 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            {/* Emergency Header */}
                            <div className="bg-red-600 p-8 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <AlertOctagon className="text-white w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Neural Shield SOS<span className="text-red-200">.</span></h2>
                                        <p className="text-red-100 text-[10px] font-bold uppercase tracking-[0.3em]">Protocole de Maintenance Prioritaire</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="text-white w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-10 space-y-8">
                                {/* Issue Type Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    <TypeButton 
                                        active={issueType === 'CRITICAL_BUG'} 
                                        onClick={() => setIssueType('CRITICAL_BUG')}
                                        label="Bug Critique" 
                                        icon={<ShieldAlert size={18} />} 
                                    />
                                    <TypeButton 
                                        active={issueType === 'UI_GLITCH'} 
                                        onClick={() => setIssueType('UI_GLITCH')}
                                        label="Problème UI" 
                                        icon={<Cpu size={18} />} 
                                    />
                                    <TypeButton 
                                        active={issueType === 'DATA_INCONSISTENCY'} 
                                        onClick={() => setIssueType('DATA_INCONSISTENCY')}
                                        label="Données" 
                                        icon={<Activity size={18} />} 
                                    />
                                    <TypeButton 
                                        active={issueType === 'PERFORMANCE'} 
                                        onClick={() => setIssueType('PERFORMANCE')}
                                        label="Lenteur" 
                                        icon={<Zap size={18} />} 
                                    />
                                </div>

                                {/* Description Field */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} /> Description de l'incident
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Que se passe-t-il ? Soyez le plus précis possible..."
                                        className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all outline-none resize-none"
                                    />
                                </div>

                                {/* Diagnostic Snapshot Info */}
                                <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Diagnostic Snapshot Prêt</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Tenant: {window.location.hostname}</span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !description.trim()}
                                    className={cn(
                                        "w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all font-black text-sm uppercase tracking-[0.3em] shadow-xl",
                                        isSubmitting || !description.trim() 
                                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                                            : "bg-red-600 text-white hover:bg-red-700 shadow-red-900/20"
                                    )}
                                >
                                    <Send size={18} className={isSubmitting ? 'animate-bounce' : ''} />
                                    {isSubmitting ? 'Lancement du Protocole...' : 'Transmettre au Cockpit'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function TypeButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest",
                active 
                    ? "bg-red-600 border-red-500 text-white shadow-lg" 
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
