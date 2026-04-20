// @ts-nocheck
"use client";

import { History, Plus, MessageSquareText } from "lucide-react";

interface Session {
    id: string;
    timestamp: Date;
    lastMessage: string;
}

interface SessionHistoryProps {
    sessions: Session[];
    onLoadSession: (id: string) => void;
    onNewSession: () => void;
}

export function SessionHistory({ sessions, onLoadSession, onNewSession }: SessionHistoryProps) {
    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 elegant-scrollbar bg-bg-primary/50">
            <div className="flex items-center justify-between mb-6">
                <h4 className="font-serif font-black text-xl text-text-primary">Historique</h4>
                <button 
                    onClick={onNewSession}
                    className="px-4 py-2 bg-text-primary text-bg-primary rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-accent-gold transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nouvelle
                </button>
            </div>
            
            {sessions.length === 0 ? (
                <p className="text-text-muted text-sm text-center italic mt-10">Aucune conversation enregistrée.</p>
            ) : (
                sessions.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => onLoadSession(s.id)}
                        className="w-full text-left p-4 rounded-2xl bg-bg-tertiary border border-border/50 hover:border-accent-gold/50 transition-all flex flex-col gap-2 group"
                    >
                        <div className="text-[10px] font-black tracking-widest uppercase text-accent-gold opacity-80 flex items-center justify-between w-full">
                            <span>
                                {s.timestamp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - {s.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <MessageSquareText className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm font-medium text-text-primary line-clamp-2 leading-relaxed">
                            {s.lastMessage}
                        </p>
                    </button>
                ))
            )}
        </div>
    );
}
