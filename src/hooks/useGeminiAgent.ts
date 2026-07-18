import { useState, useCallback, useEffect } from 'react';

import { SovereignData } from '@/shared/nexus-contract';
import { logger } from '@/lib/logger';
import { tenantScopedKey } from '@/lib/storage/tenantScopedKey';

const AGENT_SESSIONS_KEY_BASE = 'nexus_agent_sessions';

export interface MessageMetadata extends SovereignData {
    tokens?: number;
    model?: string;
    latency?: number;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: MessageMetadata;
}

export interface PendingAction {
    name: string;
    args: SovereignData;
}

export interface AgentSession {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * useOracleAgent
 * Classic Oracle hook for non-realtime text interactions with the LLM provider.
 */
export function useOracleAgent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const sendMessage = useCallback(async (text: string, context: SovereignData = {}) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/oracle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text,
                    context,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error("Erreur de communication avec l'Oracle");

            const data = await response.json() as { content: string; usage?: MessageMetadata };
            
            const assistanceMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || "Désolé, je n'ai pas pu générer de réponse.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistanceMsg]);
            
            // Handle metadata for tools etc if needed
            if (data.usage) {
                logger.debug("LLM Usage:", data.usage);
            }

        } catch (e) {
            const err = e as Error;
            logger.error("useOracleAgent Error:", err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setIsProcessing(false);
        }
    }, [messages]);

    const startNewSession = useCallback(() => {
        setMessages([]);
        setPendingAction(null);
        setError(null);
    }, []);
    const fetchAllSessions = useCallback(async (): Promise<AgentSession[]> => {
        const stored = localStorage.getItem(tenantScopedKey(AGENT_SESSIONS_KEY_BASE));
        return stored ? JSON.parse(stored) as AgentSession[] : [];
    }, []);

    const loadSession = useCallback(async (sessionId: string) => {
        const stored = localStorage.getItem(tenantScopedKey(AGENT_SESSIONS_KEY_BASE));
        if (stored) {
            const sessions = JSON.parse(stored) as AgentSession[];
            const found = sessions.find((s) => s.id === sessionId);
            if (found) {
                // To keep it simple for now, we just notify
                logger.debug("Loading session:", sessionId);
            }
        }
    }, []);
    const confirmAction = useCallback(async () => {
        // Implementation for human-in-the-loop tool calls
        setPendingAction(null);
    }, []);

    // Local storage persistence of the current session log (optional)
    useEffect(() => {
        if (messages.length > 0) {
            // Logic to update local history
        }
    }, [messages]);

    return {
        messages,
        isProcessing,
        error,
        pendingAction,
        confirmAction,
        sendMessage,
        clearError,
        fetchAllSessions,
        loadSession,
        startNewSession
    };
}

/** @deprecated Use useOracleAgent instead */
export const useGeminiAgent = useOracleAgent;
