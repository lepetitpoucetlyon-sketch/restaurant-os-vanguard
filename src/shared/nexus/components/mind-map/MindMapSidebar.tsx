"use client";

import { Zap, X, Database, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import type { MindMapNode } from './mindMapGraphData';

interface MindMapSidebarProps {
    selectedNode: MindMapNode | null;
    onClose: () => void;
}

export function MindMapSidebar({ selectedNode, onClose }: MindMapSidebarProps) {
    return (
        <div className={cn(
            "w-[400px] border-l border-border bg-bg-primary dark:bg-bg-secondary shadow-[-20px_0_40px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out absolute right-0 top-0 bottom-0 z-30 p-10 flex flex-col",
            selectedNode ? "translate-x-0" : "translate-x-full"
        )}>
            {selectedNode && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-text-primary flex items-center justify-center text-accent shadow-xl">
                            <Zap className="w-8 h-8" />
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h2 className="text-3xl font-black text-text-primary tracking-tighter mb-2">{selectedNode.label}</h2>
                    <span className="text-micro font-bold text-accent uppercase tracking-[0.2em] mb-8">{selectedNode.group} subsystem</span>

                    <p className="text-sm font-medium text-text-muted leading-relaxed mb-10">
                        {selectedNode.description}
                    </p>

                    <div className="space-y-4 flex-1">
                        <h4 className="text-nano font-black text-text-muted uppercase tracking-widest mb-2 px-2">Kpis Live</h4>
                        {selectedNode.metrics?.map((m, i) => (
                            <div key={i} className="bg-bg-tertiary p-5 rounded-[2rem] border border-border/50 flex justify-between items-center group hover:bg-accent/5 hover:border-accent/20 transition-all cursor-default">
                                <span className="text-[12px] font-bold text-text-muted group-hover:text-text-primary transition-colors">{m.label}</span>
                                <span className="text-lg font-black text-text-primary">{m.value}</span>
                            </div>
                        ))}

                        {!selectedNode.metrics && (
                            <div className="p-8 border-2 border-dashed border-subtle rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                <Database className="w-8 h-8 text-text-muted mb-4" />
                                <p className="text-sm font-bold text-text-muted">Aucun KPI en temps réel disponible pour ce module.</p>
                            </div>
                        )}
                    </div>

                    <button className="w-full h-16 bg-action-primary rounded-[2rem] text-text-on-primary font-black flex items-center justify-center gap-3 hover:bg-action-primary-hover transition-all shadow-2xl group">
                        Dépendances Profondes
                        <ArrowRight className="w-5 h-5 text-text-on-primary group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
