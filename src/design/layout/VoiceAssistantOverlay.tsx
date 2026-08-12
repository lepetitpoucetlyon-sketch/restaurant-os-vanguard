/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SovereignData } from "@nexus/contracts/nexus-contract";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, History, X, Maximize2, Minimize2, AlertTriangle, Minus, Bot } from 'lucide-react';
import { useGeminiAgent } from "@/modules/intelligence";
import { useGeminiLive } from '@/modules/commerce';
import { useSettings } from "@/kernel/hooks";

import { cn } from "@/lib/ui.foundations";

import { NexusSphere } from '@design/voice/ui/NexusSphere';
import { ChatThread } from '@design/voice/ui/ChatThread';
import { SessionHistory } from '@design/voice/ui/SessionHistory';
import { ChatInput } from '@design/voice/ui/ChatInput';
import { formatAssistantText } from '@design/voice/ui/voice-utils';

export function VoiceAssistantOverlay() {
    // ✅ SSR-safe mount detection via lazy initializer (avoids setState-in-effect)
    const [isMounted] = useState(() => typeof window !== 'undefined');
    const [isOpen, setIsOpen] = useState(false);

    const [isExpanded, setIsExpanded] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [isDictating, setIsDictating] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<{ id: string, timestamp: Date, lastMessage: string }[]>([]);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    
    // All refs must be declared unconditionally (Rules of Hooks)
    const pageContextRef = useRef<SovereignData | null>(null);

    const recognitionRef = useRef<{ stop: () => void } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);



    const { settings } = useSettings();
    const config = settings.nexusConfig;
    const aiName = config?.aiName || "NEXUS";

    useEffect(() => {
        const handleContextUpdate = (e: CustomEvent) => {
            pageContextRef.current = e.detail;
        };
        window.addEventListener('ai:context_update', handleContextUpdate);
        return () => window.removeEventListener('ai:context_update', handleContextUpdate);
    }, []);

    const {
        messages,
        isProcessing,
        error: chatError,
        pendingAction,
        confirmAction,
        sendMessage,
        clearError: _clearError,
        fetchAllSessions,
        loadSession,
        startNewSession
    } = useGeminiAgent();

    const {
        isActive: isLiveActive,
        isConnecting: _isLiveConnecting,
        error: liveError,
        transcripts: _liveTranscripts,
        startSession: _startLiveSession,
        stopSession: _stopLiveSession,
        sendText: _sendLiveText
    } = useGeminiLive();

    const error = chatError || liveError;

    const toggleDictation = useCallback(() => {
        if (isDictating && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsDictating(false);
            return;
        }

        const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new (SpeechRecognition as { new(): { lang: string; onstart: (() => void) | null; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } })();
        recognitionRef.current = recognition;
        recognition.lang = 'fr-FR';
        recognition.onstart = () => setIsDictating(true);
        recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) sendMessage(transcript, pageContextRef.current ?? undefined);
        };
        recognition.onerror = () => setIsDictating(false);
        recognition.onend = () => setIsDictating(false);
        recognition.start();
    }, [isDictating, sendMessage]);

    const speakMessage = useCallback((text: string) => {
        if (!isVoiceMode || typeof window === 'undefined') return;
        const cleanText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n/g, ' ');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.onend = () => { if (isVoiceMode) setTimeout(toggleDictation, 500); };
        window.speechSynthesis.cancel(); 
        window.speechSynthesis.speak(utterance);
    }, [isVoiceMode, toggleDictation]);

    useEffect(() => {
        const lastMsg = messages[messages.length - 1] as { role?: string; content?: string; text?: string } | undefined;
        if (lastMsg && lastMsg.role === 'assistant' && !isProcessing) speakMessage(lastMsg.content || lastMsg.text || '');
    }, [messages, isProcessing, speakMessage]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        window.speechSynthesis.cancel();
        if (isDictating && recognitionRef.current) recognitionRef.current.stop();
    };

    const toggleHistory = async () => {
        if (!showHistory) {
            const hist = await fetchAllSessions();
            const mappedSessions = hist.map(h => ({
                id: h.id,
                timestamp: h.createdAt ? new Date(h.createdAt) : new Date(),
                lastMessage: h.name || "Conversation"
            }));
            setSessions(mappedSessions);
        }
        setShowHistory(!showHistory);
    };

    // Early return AFTER all hooks (Rules of Hooks compliant)
    if (!isMounted) return null;

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0, y: 20 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[190] w-14 h-14 md:w-16 md:h-16 bg-accent rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(197,160,89,0.3)] border border-default hover:scale-110 active:scale-95 transition-all group"
                    >
                        <Bot className="w-7 h-7 md:w-8 md:h-8 text-text-primary relative z-10" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full border-2 border-bg-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-surface-card animate-pulse" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "fixed z-[200] bg-bg-primary/95 backdrop-blur-3xl border border-border/50 shadow-[0_32px_128px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden transition-all duration-500",
                            isExpanded ? "inset-0 md:inset-10 rounded-0 md:rounded-[3rem]" : "bottom-0 right-0 w-full h-full rounded-0 md:bottom-6 md:right-6 md:w-[450px] md:h-[700px] md:rounded-[2.5rem]"
                        )}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 shrink-0 bg-gradient-to-br from-black/20 to-transparent">
                            <div className="flex items-center gap-3">
                                <NexusSphere isActive={isLiveActive} isProcessing={isProcessing} />
                                <div>
                                    <h3 className="font-serif font-black text-lg text-text-primary leading-tight tracking-tighter">{aiName}</h3>
                                    <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest flex items-center gap-1">
                                        {isLiveActive ? "Live Central" : isProcessing ? "Réflexion..." : "Vigilance Active"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsVoiceMode(!isVoiceMode)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isVoiceMode ? "bg-accent text-text-primary shadow-lg shadow-accent/20" : "bg-bg-tertiary text-text-muted")}>
                                    {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button onClick={toggleHistory} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", showHistory ? "bg-accent-gold text-primary" : "bg-bg-secondary border border-border/50")}>
                                    <History className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsExpanded(!isExpanded)} className="hidden md:flex w-8 h-8 rounded-full bg-bg-tertiary items-center justify-center text-text-muted hover:bg-bg-secondary">
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-primary"><Minus className="w-4 h-4" /></button>
                                <button onClick={() => { handleClose(); startNewSession?.(); }} className="w-8 h-8 rounded-full bg-error/10 text-error hover:bg-error hover:text-text-primary transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {showHistory ? (
                            <SessionHistory sessions={sessions} onLoadSession={(id) => { loadSession(id); setShowHistory(false); }} onNewSession={() => { startNewSession(); setShowHistory(false); }} />
                        ) : (
                            <ChatThread 
                                messages={messages.map(msg => ({
                                    id: msg.id,
                                    role: msg.role === 'assistant' ? ('model' as const) : msg.role,
                                    text: msg.content
                                }))} 
                                isProcessing={isProcessing} 
                                formatText={formatAssistantText} 
                                scrollRef={scrollRef} 
                            />
                        )}

                        {error && (
                            <div className="shrink-0 mx-4 mb-2 px-4 py-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3">
                                <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                                <p className="text-[11px] font-medium text-error leading-snug">{error}</p>
                            </div>
                        )}

                        {pendingAction && (
                            <div className="bg-bg-tertiary border-t border-accent-gold/40 px-6 py-5 shrink-0">
                                <div className="flex items-center gap-3 text-accent-gold mb-3">
                                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                                    <p className="text-sm font-medium text-text-primary">Oracle veut exécuter : <span className="font-bold underline">{pendingAction.name}</span></p>
                                </div>
                                <button onClick={() => confirmAction()} className="w-full h-12 rounded-xl bg-success text-text-primary font-black uppercase tracking-widest text-[10px] shadow-lg shadow-success/20">Autoriser</button>
                            </div>
                        )}

                        <ChatInput textInput={textInput} setTextInput={setTextInput} isDictating={isDictating} isProcessing={isProcessing} pendingAction={!!pendingAction} onSend={(e) => { e.preventDefault(); if (textInput.trim()) { sendMessage(textInput, pageContextRef.current ?? undefined); setTextInput(""); } }} onToggleDictation={toggleDictation} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
