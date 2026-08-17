/**
 * 🧠 Assistant State Store — Atomes Jotai pour le Copilote IA & Contrôle Vocal
 * 
 * Centralise l'état global du Chatbot pour garantir la persistance des conversations,
 * l'intégration multi-pages et le contrôle vocal temps réel (STT/TTS).
 */

import { atom } from 'jotai';
import { ActionProposal } from '@/modules/intelligence/services/AssistantActionDispatcher';

export type AssistantViewMode = 'COLLAPSED' | 'DOCK_RIGHT' | 'EXPANDED';
export type AssistantTab = 'chat' | 'context' | 'history';

export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string | Date;
    suggestedActions?: ActionProposal[];
    variant?: string;
    roleLevel?: number;
    toolResult?: {
        toolId: string;
        title: string;
        data?: Record<string, unknown>;
    };
}

export interface AssistantVoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    speechTranscript: string;
    audioLevel: number; // 0 à 100 pour l'onde sonore
    lastError?: string | null;
}

export interface AssistantToolState {
    activeToolId: string | null;
    status: 'idle' | 'executing' | 'success' | 'error';
    progressMessage?: string;
}

// ── 1. État de la Fenêtre & Navigation ──
export const assistantViewModeAtom = atom<AssistantViewMode>('COLLAPSED');
export const assistantActiveTabAtom = atom<AssistantTab>('chat');

// ── 2. État des Messages & Conversation ──
export const assistantMessagesAtom = atom<AssistantMessage[]>([
    {
        id: 'AST-WELCOME',
        role: 'assistant',
        content: 'Bonjour ! Je suis votre Copilote Restaurant OS. Vous pouvez me poser vos questions à l\'écrit ou à la voix (CA d\'hier, stocks des frigos, factures...).',
        timestamp: new Date().toISOString(),
    }
]);

export const assistantIsProcessingAtom = atom<boolean>(false);
export const assistantErrorAtom = atom<string | null>(null);

// ── 3. État Vocal (Speech-to-Text & Text-to-Speech) ──
export const assistantVoiceStateAtom = atom<AssistantVoiceState>({
    isListening: false,
    isSpeaking: false,
    speechTranscript: '',
    audioLevel: 0,
    lastError: null,
});

// ── 4. État d'Exécution des Outils & Function Calling ──
export const assistantToolStateAtom = atom<AssistantToolState>({
    activeToolId: null,
    status: 'idle',
});
