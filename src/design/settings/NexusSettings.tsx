'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Plus,
    Trash2,
    Volume2,
    Check,
    Cpu,
    Eye,
    EyeOff,
    Server,
    Bot,
    Wand2,
    Zap
} from 'lucide-react';
import { useSettings } from '@/shared/hooks';
import { GEMINI_VOICES, NexusMacro, NexusConfig, AI_PROVIDER_MODELS, AIProvider } from '@nexus/contracts/settings/nexus';
import { cn } from '@/lib/ui.foundations';
import { NexusHeroHeader } from './nexus-settings/NexusHeroHeader';
import { NexusIdentitySection } from './nexus-settings/NexusIdentitySection';

const PROVIDER_META: Record<AIProvider, { label: string; color: string; hint: string; keyLabel: string }> = {
    gemini:    { label: 'Google Gemini',  color: '#4285F4', hint: 'Fournisseur par défaut. Requis pour Nexus Live (voix).', keyLabel: 'Clé API Gemini' },
    openai:    { label: 'OpenAI',         color: '#10A37F', hint: 'Compatible GPT-4o et GPT-4-Turbo.', keyLabel: 'Clé API OpenAI' },
    anthropic: { label: 'Anthropic',      color: '#D97706', hint: 'Modèles Claude — excellents pour le raisonnement.', keyLabel: 'Clé API Anthropic' },
    local:     { label: 'Modèle Local',   color: '#8B5CF6', hint: 'Ollama ou serveur compatible OpenAI. Aucune clé requise.', keyLabel: 'URL du serveur local' },
};

export default function NexusSettings() {
    const { settings, updateSLM } = useSettings();
    const [showApiKey, setShowApiKey] = useState(false);
    
    const config = settings.nexusConfig || {
        aiName: 'NEXUS',
        voiceId: 'aoede',
        personality: 'expert',
        macros: [],
        historyEnabled: true,
        autoLanguage: true
    };

    const updateConfig = (updates: Partial<NexusConfig>) => {
        updateSLM?.({ nexusConfig: { ...config, ...updates } });
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

    const activeProvider: AIProvider = (config.aiProvider as AIProvider | undefined) ?? 'gemini';
    const availableModels = AI_PROVIDER_MODELS[activeProvider];
    const activeModel = config.aiModel ?? availableModels[0]?.id ?? '';
    const providerMeta = PROVIDER_META[activeProvider];

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
            <NexusHeroHeader />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants}>
                    <NexusIdentitySection config={config} updateConfig={updateConfig} />
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
                                        config.voiceId === v.id ? "bg-accent text-primary" : "bg-bg-primary text-text-muted"
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
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- FOURNISSEUR IA MODEL-AGNOSTIC --- */}
            <motion.div variants={itemVariants}>
                <div className="bg-bg-secondary border border-border rounded-[2rem] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                            <Cpu className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-text-primary">Fournisseur IA</h3>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Moteur d'Intelligence</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {(Object.keys(PROVIDER_META) as AIProvider[]).map((p) => {
                            const meta = PROVIDER_META[p];
                            const isActive = activeProvider === p;
                            return (
                                <button
                                    key={p}
                                    onClick={() => updateConfig({ aiProvider: p, aiModel: AI_PROVIDER_MODELS[p][0]?.id, aiApiKey: '' })}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center",
                                        isActive
                                            ? "border-accent bg-bg-tertiary shadow-sm"
                                            : "border-border hover:border-border-hover"
                                    )}
                                >
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: isActive ? meta.color + '22' : undefined }}
                                    >
                                        {p === 'local' ? (
                                            <Server className="w-4 h-4" style={{ color: isActive ? meta.color : undefined }} />
                                        ) : (
                                            <Bot className="w-4 h-4" style={{ color: isActive ? meta.color : undefined }} />
                                        )}
                                    </div>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-text-primary" : "text-text-muted")}>
                                        {meta.label}
                                    </span>
                                    {isActive && <Check className="w-3 h-3 text-accent" />}
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-xs text-text-muted mb-5 bg-bg-tertiary/50 px-4 py-2 rounded-xl border border-border italic">
                        {providerMeta.hint}
                    </p>

                    <div className="space-y-2 mb-5">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Modèle</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {availableModels.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => updateConfig({ aiModel: m.id })}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left transition-all",
                                        activeModel === m.id
                                            ? "border-accent bg-bg-tertiary"
                                            : "border-border hover:border-border-hover"
                                    )}
                                >
                                    <div>
                                        <p className="text-xs font-bold text-text-primary">{m.label}</p>
                                        <p className={cn(
                                            "text-[9px] uppercase tracking-widest font-black mt-0.5",
                                            m.tier === 'fast' ? "text-status-success" : m.tier === 'powerful' ? "text-status-danger" : "text-action-primary"
                                        )}>{m.tier}</p>
                                    </div>
                                    {activeModel === m.id && <Check className="w-3 h-3 text-accent shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">
                            {activeProvider === 'local' ? 'URL du serveur' : providerMeta.keyLabel}
                        </label>
                        <div className="relative">
                            <input
                                type={activeProvider === 'local' ? 'text' : (showApiKey ? 'text' : 'password')}
                                value={activeProvider === 'local' ? (config.aiEndpoint ?? '') : (config.aiApiKey ?? '')}
                                onChange={(e) => activeProvider === 'local'
                                    ? updateConfig({ aiEndpoint: e.target.value })
                                    : updateConfig({ aiApiKey: e.target.value })
                                }
                                placeholder={activeProvider === 'local' ? 'http://localhost:11434' : 'sk-...'}
                                className="w-full bg-bg-tertiary/50 border border-border rounded-2xl px-5 py-3 pr-12 text-text-primary text-sm font-mono focus:outline-none focus:border-accent transition-all"
                            />
                            {activeProvider !== 'local' && (
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                        {activeProvider !== 'local' && (
                            <p className="text-[10px] text-text-muted ml-1">La clé est chiffrée et stockée localement dans Nexus.</p>
                        )}
                    </div>
                </div>
            </motion.div>

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
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-status-danger transition-all rounded-lg hover:bg-status-danger/5"
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
