'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpert } from '@/modules/intelligence';
import { Target, Search, X, Zap, Activity } from 'lucide-react';
import { InsightsConsole } from './InsightsConsole';
import type { AgentReasoningStep, AgentDomain } from '@/modules/intelligence';

interface ExpertHubProps {
    domain: AgentDomain;
}

export const ExpertHub: React.FC<ExpertHubProps> = ({ domain }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [reasoning, setReasoning] = useState<AgentReasoningStep[]>([]);
    
    const { queryExpert, isConfigured, isAuthorized, modelId } = useExpert(domain);

    const handleRun = async () => {
        if (!prompt || !isConfigured || !isAuthorized) return;

        setIsAnalyzing(true);
        setReasoning([]);

        try {
            const response = await queryExpert(prompt);
            setReasoning(response.insight.reasoning);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isAuthorized) return null;

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-8 z-50 w-16 h-16 rounded-[2rem] bg-surface-sidebar text-accent-gold flex items-center justify-center shadow-2xl border border-default group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <Activity className="w-8 h-8 relative z-10" />
            </motion.button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-surface-sidebar/40 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-card/95 dark:bg-surface-sidebar/95 backdrop-blur-xl z-[70] shadow-[-20px_0_50px_rgba(0,0,0,0.3)] border-l border-subtle flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight uppercase">Centre d'Expertise</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold mt-1">Diagnostic Système Intégré</p>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center hover:bg-error/10 hover:text-error transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                <InsightsConsole 
                                    domain={domain} 
                                    isAnalyzing={isAnalyzing} 
                                    reasoning={reasoning} 
                                    modelId={modelId}
                                />

                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={`Lancer un diagnostic sur ${domain}...`}
                                            className="w-full h-32 p-6 bg-bg-tertiary rounded-[2rem] border-none text-[12px] font-medium leading-relaxed outline-none resize-none focus:ring-2 ring-accent-gold/20 transition-all"
                                        />
                                        <button 
                                            onClick={handleRun}
                                            disabled={!prompt || isAnalyzing || !isConfigured}
                                            className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-accent-gold text-text-primary flex items-center justify-center shadow-lg disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Zap className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {!isConfigured && (
                                        <p className="text-[9px] text-error font-black uppercase text-center tracking-widest">
                                            ⚠️ Paramètres d'expertise manquants
                                        </p>
                                    )}
                                </div>

                                {/* Shortcuts */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Audit de conformité", icon: Search },
                                        { label: "Analyse des risques", icon: Target },
                                    ].map((s, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setPrompt(s.label)}
                                            className="p-4 rounded-2xl bg-bg-tertiary border border-border/50 hover:border-accent-gold/30 flex flex-col items-center gap-2 transition-all"
                                        >
                                            <s.icon className="w-4 h-4 text-accent-gold" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
