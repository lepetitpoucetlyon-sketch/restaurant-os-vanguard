'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { NexusConfig } from '@nexus/contracts/settings/nexus';

interface Props {
    config: NexusConfig;
    updateConfig: (updates: Partial<NexusConfig>) => void;
}

export function NexusIdentitySection({ config, updateConfig }: Props) {
    return (
        <div className="bg-bg-secondary border border-border rounded-[2rem] p-8 shadow-sm h-full">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                    <Bot className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h3 className="text-xl font-serif text-text-primary">Identité Assistée</h3>
                    <p className="text-nano text-text-muted uppercase tracking-widest font-black">ADN Système</p>
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
                                onClick={() => updateConfig({ personality: p as NexusConfig['personality'] })}
                                className={cn(
                                    "px-4 py-3 rounded-xl border transition-all text-micro font-bold uppercase tracking-widest",
                                    config.personality === p 
                                        ? "bg-accent text-primary border-accent" 
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
                            "absolute top-1 w-4 h-4 rounded-full bg-surface-card transition-all",
                            config.historyEnabled ? "right-1" : "left-1"
                        )} />
                    </button>
                </div>
            </div>
        </div>
    );
}
