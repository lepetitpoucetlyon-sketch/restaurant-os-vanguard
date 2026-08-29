"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { logger } from "@/lib/logger";
import type { ActionProposal } from "@/modules/intelligence";
import {
    assistantViewModeAtom,
    assistantActiveTabAtom,
    assistantMessagesAtom,
    assistantIsProcessingAtom,
    assistantErrorAtom,
    assistantVoiceStateAtom,
    assistantToolStateAtom,
    type AssistantMessage,
    type AssistantViewMode,
    type AssistantTab,
    type AssistantVoiceState,
    type AssistantToolState,
} from "@/store/assistantAtoms";
import {
    PATH_SUGGESTIONS,
    resolvePathKey,
    type ContextualSuggestion,
} from "./assistant/assistantSuggestions";

export type { AssistantViewMode, AssistantTab, AssistantMessage, AssistantVoiceState, AssistantToolState, ContextualSuggestion };

interface OracleResponse {
    content?: string;
    suggestedActions?: ActionProposal[];
    variant?: string;
    roleLevel?: number;
    toolResult?: {
        toolId: string;
        title: string;
        data?: Record<string, unknown>;
    };
}

async function oracleFetch<T>(body: unknown): Promise<T> {
    const res = await fetch('/api/oracle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? 'Erreur de communication avec le Copilote.');
    }
    return res.json() as Promise<T>;
}

interface SpeechRecognitionEventLike {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface ISpeechRecognitionInstance {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: (() => void) | null;
    onresult: ((e: SpeechRecognitionEventLike) => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

export function useUniversalAssistant() {
    const pathname = usePathname();
    const [viewMode, setViewMode] = useAtom(assistantViewModeAtom);
    const [activeTab, setActiveTab] = useAtom(assistantActiveTabAtom);
    const [messages, setMessages] = useAtom(assistantMessagesAtom);
    const [isProcessing, setIsProcessing] = useAtom(assistantIsProcessingAtom);
    const [error, setError] = useAtom(assistantErrorAtom);
    const [voiceState, setVoiceState] = useAtom(assistantVoiceStateAtom);
    const [toolState, setToolState] = useAtom(assistantToolStateAtom);
    const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
                e.preventDefault();
                setViewMode(prev => (prev === 'COLLAPSED' ? 'DOCK_RIGHT' : 'COLLAPSED'));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setViewMode]);

    const getContextSuggestions = useCallback(
        () => PATH_SUGGESTIONS[resolvePathKey(pathname || '')],
        [pathname]
    );

    const speakResponse = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.05;
            utterance.onstart = () => setVoiceState(prev => ({ ...prev, isSpeaking: true }));
            utterance.onend = () => setVoiceState(prev => ({ ...prev, isSpeaking: false }));
            utterance.onerror = () => setVoiceState(prev => ({ ...prev, isSpeaking: false }));
            window.speechSynthesis.speak(utterance);
        } catch {
            setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        }
    }, [setVoiceState]);

    const sendMessage = useCallback(async (text: string, options?: { speak?: boolean }) => {
        if (!text.trim() || isProcessing) return;
        setMessages(prev => [...prev, { id: `USR-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }]);
        setIsProcessing(true);
        setError(null);
        try {
            const data = await oracleFetch<OracleResponse>({
                prompt: text.trim(),
                context: { currentPath: pathname },
                history: messages.map(m => ({ role: m.role, content: m.content })),
            });

            const assistantReply = data.content ?? 'Je n\'ai pas pu générer de réponse.';
            setMessages(prev => [...prev, {
                id: `AST-${Date.now()}`,
                role: 'assistant',
                content: assistantReply,
                timestamp: new Date().toISOString(),
                suggestedActions: data.suggestedActions,
                variant: data.variant,
                roleLevel: data.roleLevel,
                toolResult: data.toolResult,
            }]);

            if (options?.speak) {
                speakResponse(assistantReply);
            }
        } catch (e) {
            logger.error('[useUniversalAssistant] Error:', e);
            setError((e as Error).message ?? 'Une erreur est survenue.');
        } finally {
            setIsProcessing(false);
        }
    }, [messages, isProcessing, pathname, setMessages, setIsProcessing, setError, speakResponse]);

    const startVoiceListening = useCallback(() => {
        if (typeof window === 'undefined') return;
        const win = window as unknown as {
            SpeechRecognition?: new () => ISpeechRecognitionInstance;
            webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
        };
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (!SpeechRecognitionClass) {
            setVoiceState(prev => ({ ...prev, lastError: 'Reconnaissance vocale non supportée sur ce navigateur.' }));
            return;
        }

        try {
            if (recognitionRef.current) recognitionRef.current.abort();

            const recognition = new SpeechRecognitionClass();
            recognitionRef.current = recognition;
            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setVoiceState(prev => ({ ...prev, isListening: true, speechTranscript: '', lastError: null }));
            };
            recognition.onresult = (event: SpeechRecognitionEventLike) => {
                const transcript = Array.from(event.results).map((r) => r[0]?.transcript || '').join('');
                setVoiceState(prev => ({ ...prev, speechTranscript: transcript }));
            };
            recognition.onend = () => {
                setVoiceState(prev => {
                    const finalTranscript = prev.speechTranscript.trim();
                    if (finalTranscript) sendMessage(finalTranscript, { speak: true });
                    return { ...prev, isListening: false };
                });
            };
            recognition.onerror = (event: { error: string }) => {
                setVoiceState(prev => ({ ...prev, isListening: false, lastError: event.error }));
            };
            recognition.start();
        } catch (err) {
            setVoiceState(prev => ({ ...prev, isListening: false, lastError: (err as Error).message }));
        }
    }, [sendMessage, setVoiceState]);

    const stopVoiceListening = useCallback(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setVoiceState(prev => ({ ...prev, isListening: false }));
    }, [setVoiceState]);

    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }, [setVoiceState]);

    const executeAction = useCallback(async (proposal: ActionProposal): Promise<void> => {
        setToolState({ activeToolId: proposal.toolId, status: 'executing', progressMessage: `Exécution de ${proposal.title}...` });
        try {
            const data = await oracleFetch<unknown>({ executeAction: { toolId: proposal.toolId, params: proposal.params } });
            setMessages(prev => prev.map(msg => !msg.suggestedActions ? msg : {
                ...msg,
                suggestedActions: msg.suggestedActions.map(a => a.id === proposal.id ? { ...a, status: 'executed' as const } : a),
            }));
            setToolState({ activeToolId: proposal.toolId, status: 'success' });
            logger.info('[useUniversalAssistant] Action executed:', data);
        } catch (err) {
            setToolState({ activeToolId: proposal.toolId, status: 'error', progressMessage: (err as Error).message });
        }
    }, [setMessages, setToolState]);

    const clearSession = useCallback(() => {
        setMessages([
            {
                id: 'AST-WELCOME',
                role: 'assistant',
                content: 'Session réinitialisée. Comment puis-je vous assister ?',
                timestamp: new Date().toISOString(),
            }
        ]);
        setError(null);
    }, [setMessages, setError]);

    return {
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        messages,
        isProcessing,
        error,
        voiceState,
        toolState,
        startVoiceListening,
        stopVoiceListening,
        stopSpeaking,
        sendMessage,
        executeAction,
        clearSession,
        contextSuggestions: getContextSuggestions(),
    };
}
