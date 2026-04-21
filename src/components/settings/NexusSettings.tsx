'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Cpu, 
    Bot, 
    Mic, 
    Wand2, 
    Save, 
    ShieldCheck, 
    Zap, 
    Plus, 
    Trash2, 
    History,
    Volume2,
    Check
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { GEMINI_VOICES, NexusMacro } from '@/types/nexus';
import { NexusSphere } from "@/components/layout/NexusSphere";
import { cn } from '@/lib/ui.foundations';

export default function NexusSettings() {
    const { settings, updateSLM } = useSettings();
    const [isSaving, setIsSaving] = useState(false);
    
    // Local state for Nexus Config (mapped from slmConfig or its own field)
    // For now, we use nexusConfig from settings
    const config = settings.nexusConfig || {
        aiName: 'NEXUS',
        voiceId: 'aoede',
        personality: 'expert',
        macros: [],
        historyEnabled: true,
        autoLanguage: true
    };

    const updateConfig = (updates: Partial<import('@/types/nexus').NexusConfig>) => {
        // Proper immutable update via the settings context
        updateSLM({ nexusConfig: { ...config, ...updates } });
    };

    const addMacro = () => {
        const newMacro: NexusMacro = {
            id: `macro-${Date.now()}`,
            trigger: '',
            instruction: '',
            isActive: true
        };
        updateConfig({ macros: [...config.macros, newMacro] });
    };

    const removeMacro = (id: string) => {
        updateConfig({ macros: config.macros.filter(m => m.id !== id) });
    };

    const updateMacro = (id: string, updates: Partial<NexusMacro>) => {
        const updated = config.macros.map(m => m.id === id ? { ...m, ...updates } : m);
        updateConfig({ macros: updated });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-20"
        >
            {/* --- HERO SECTION: IDENTITY PREVIEW --- */}
            <div className="relative rounded-[2.5rem] bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border p-10 overflow-hidden group shadow-premium">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all duration-1000" />
                
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-full bg-bg-primary/50 backdrop-blur-md border border-border flex items-center justify-center shadow-2xl relative z-10">
                            <NexusSphere isActive={false} isProcessing={false} />
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full"
                        />
                    </div>

                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-2">
                            <Zap className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Souveraineté Digitale</span>
                        </div>
                        <h2 className="text-4xl font-serif text-text-primary tracking-tight">
                            Personalisez votre <span className="text-accent italic">Nexus</span>
                        </h2>
                        <p className="text-text-muted max-w-xl text-lg font-medium leading-relaxed">
                            Configurez l'intelligence centrale de votre établissement. 
                            Modifiez son identité, sa voix et créez des raccourcis opérationnels sur-mesure pour votre équipe.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- CONFIGURATION D'IDENTITÉ --- */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-bg-secondary border border-border rounded-[2rem] p-8 shadow-sm h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                                <Bot className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif text-text-primary">Identité Assistée</h3>
                                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">ADN Système</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nom du Nexus</label>
                                <input 
                                    type="text"
                                    value={config.aiName}
                                    onChange={(e) => updateConfig({ aiName: e.target.value })}
                                    className="w-full bg-bg-tertiary/50 border border-border rounded-2xl px-6 py-4 text-text-primary focus:outline-none focus:border-accent transition-all font-bold text-lg"
                                    placeholder="ex: ALBERT, NEXUS, ETIENNE..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Personnalité</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['expert', 'concise', 'friendly', 'protective'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => updateConfig({ personality: p })}
                                            className={cn(
                                                "px-4 py-3 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-widest",
                                                config.personality === p 
                                                    ? "bg-accent text-black border-accent" 
                                                    : "bg-bg-tertiary border-border text-text-muted hover:border-accent/40"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <div className={cn(
                                    "w-4 h-4 rounded-full",
                                    config.historyEnabled ? "bg-success" : "bg-text-muted"
                                )} />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-primary">Mémoire Opérationnelle</p>
                                    <p className="text-xs text-text-muted">Sauvegarde les transcriptions vocales pour analyse.</p>
                                </div>
                                <button 
                                    onClick={() => updateConfig({ historyEnabled: !config.historyEnabled })}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative",
                                        config.historyEnabled ? "bg-success" : "bg-bg-tertiary border border-border"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                        config.historyEnabled ? "right-1" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* --- CHOIX DE LA VOIX --- */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-bg-secondary border border-border rounded-[2rem] p-8 shadow-sm h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                                <Volume2 className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif text-text-primary">Moteur Vocal</h3>
                                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Synthèse Gemini Live</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {GEMINI_VOICES.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => updateConfig({ voiceId: v.id })}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                                        config.voiceId === v.id 
                                            ? "bg-bg-tertiary border-accent shadow-sm"
                                            : "border-border hover:border-border-hover"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        config.voiceId === v.id ? "bg-accent text-black" : "bg-bg-primary text-text-muted"
                                    )}>
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-text-primary">{v.name}</span>
                                            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-muted">
                                                {v.gender === 'female' ? 'Féminin' : 'Masculin'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted font-medium">{v.description}</p>
                                    </div>
                                    {config.voiceId === v.id && (
                                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                                            <Check className="w-3 h-3 text-black" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- NEXUS MACROS: OPERATIONAL SHORTCUTS --- */}
            <motion.div variants={itemVariants}>
                <div className="bg-bg-secondary border border-border rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Zap className="w-40 h-40 text-accent rotate-12" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-3xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                <Wand2 className="w-7 h-7 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif text-text-primary">Nexus Macros</h3>
                                <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">Automatisations Short-Circuit</p>
                            </div>
                        </div>

                        <button 
                            onClick={addMacro}
                            className="flex items-center gap-3 px-6 py-3 bg-text-primary text-bg-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau Raccourci
                        </button>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {config.macros.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl border-2 border-dashed border-border">
                                <Zap className="w-12 h-12 text-text-muted/30" />
                                <p className="text-text-muted font-medium italic">Aucun raccourci configuré. <br/>Créez votre première macro pour accélérer le service.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {config.macros.map((macro) => (
                                        <motion.div 
                                            key={macro.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-6 bg-bg-tertiary/40 border border-border rounded-3xl hover:border-accent/40 transition-colors group relative"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center shadow-sm">
                                                        <Check className="w-4 h-4 text-accent" />
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        value={macro.trigger}
                                                        onChange={(e) => updateMacro(macro.id, { trigger: e.target.value })}
                                                        placeholder="Phrase courte (ex: 'Midi Check')"
                                                        className="flex-1 bg-transparent border-none p-0 text-text-primary font-bold placeholder:text-text-muted focus:ring-0 text-sm"
                                                    />
                                                    <button 
                                                        onClick={() => removeMacro(macro.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-500 transition-all rounded-lg hover:bg-red-500/5"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={macro.instruction}
                                                    onChange={(e) => updateMacro(macro.id, { instruction: e.target.value })}
                                                    placeholder="Instruction complexe à exécuter (ex: 'Vérifie les stocks de pain et dis-moi si tout va bien pour le service...')"
                                                    rows={3}
                                                    className="w-full bg-bg-primary/50 border border-border rounded-xl px-4 py-3 text-xs text-text-muted font-medium focus:outline-none focus:border-accent transition-all resize-none italic"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
