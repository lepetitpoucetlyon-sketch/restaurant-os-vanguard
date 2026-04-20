// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    [key: string]: any;
}

export interface PendingAction {
    name: string;
    args: Record<string, unknown>;
}

/**
 * useGeminiAgent
 * Classic Oracle hook for non-realtime text interactions with Gemini.
 */
export function useGeminiAgent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const sendMessage = useCallback(async (text: string, context: Record<string, unknown> = {}) => {
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
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text,
                    context,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error("Erreur de communication avec l'Oracle");

            const data = await response.json() as { content: string; usage?: unknown };
            
            const assistanceMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || "Désolé, je n'ai pas pu générer de réponse.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistanceMsg]);
            
            // Handle metadata for tools etc if needed
            if (data.usage) {
                console.log("Gemini Usage:", data.usage);
            }

        } catch (err: unknown) {
            console.error("useGeminiAgent Error:", err);
            setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        } finally {
            setIsProcessing(false);
        }
    }, [messages]);

    const startNewSession = useCallback(() => {
        setMessages([]);
        setPendingAction(null);
        setError(null);
    }, []);

    const fetchAllSessions = useCallback(async (): Promise<Array<{ id: string; name: string }>> => {
        const stored = localStorage.getItem('nexus_agent_sessions');
        return stored ? JSON.parse(stored) : [];
    }, []);

    const loadSession = useCallback(async (sessionId: string) => {
        const stored = localStorage.getItem('nexus_agent_sessions');
        if (stored) {
            const sessions = JSON.parse(stored) as Array<{ id: string }>;
            const found = sessions.find((s) => s.id === sessionId);
            if (found) {
                // To keep it simple for now, we just notify
                console.log("Loading session:", sessionId);
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
