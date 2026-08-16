"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { logger } from "@/lib/logger";
import { ActionProposal } from "@/modules/intelligence/services/AssistantActionDispatcher";

export type AssistantViewMode = 'COLLAPSED' | 'DOCK_RIGHT' | 'EXPANDED';
export type AssistantTab = 'chat' | 'context' | 'history';

export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    suggestedActions?: ActionProposal[];
    variant?: string;
    roleLevel?: number;
}

export interface ContextualSuggestion {
    id: string;
    title: string;
    prompt: string;
    icon?: string;
}

interface OracleResponse {
    content?: string;
    suggestedActions?: ActionProposal[];
    variant?: string;
    roleLevel?: number;
}

async function oracleFetch<T>(body: unknown): Promise<T> {
    const res = await fetch('/api/oracle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? 'Erreur de communication avec le Copilote.');
    }
    return res.json() as Promise<T>;
}

type SuggestionKey = 'pos' | 'inventory' | 'finance' | 'luxury' | 'default';

const PATH_SUGGESTIONS: Record<SuggestionKey, ContextualSuggestion[]> = {
    pos: [
        { id: '1', title: 'Verrouiller une table', prompt: 'Peux-tu verrouiller la table 4 pour une arrivée VIP ?' },
        { id: '2', title: 'Procédure avoir/remise', prompt: 'Comment enregistrer un geste commercial ou un avoir sur une addition ?' },
        { id: '3', title: 'Articles en rupture', prompt: 'Quels sont les articles actuellement en rupture de stock ?' },
    ],
    inventory: [
        { id: '1', title: 'DLC & Alertes Péremption', prompt: 'Quels ingrédients arrivent à péremption dans les prochaines 48 heures ?' },
        { id: '2', title: 'Commande Fournisseur', prompt: 'Prépare une commande fournisseur pour les articles en seuil critique.' },
        { id: '3', title: 'Écart de portionnement', prompt: 'Y a-t-il des anomalies récentes de coût matière sur les fiches techniques ?' },
    ],
    finance: [
        { id: '1', title: 'Synthèse CA du jour', prompt: 'Donne-moi la synthèse du chiffre d\'affaires encaissé aujourd\'hui par mode de paiement.' },
        { id: '2', title: 'Vérification NF525', prompt: 'Le registre de scellement fiscal est-il 100% synchronisé et intègre ?' },
        { id: '3', title: 'TVA CA3 prévisionnelle', prompt: 'Quel est le montant estimé de TVA collectée sur la période en cours ?' },
    ],
    luxury: [
        { id: '1', title: 'Cote Marché Sacs', prompt: 'Quelle est l\'évolution de la cote du Hermès Birkin 30 Crocodile ?' },
        { id: '2', title: 'Rendement Locatif', prompt: 'Quel est le rendement locatif moyen versé aux investisseurs ce mois-ci ?' },
        { id: '3', title: 'Statut Chambre Forte', prompt: 'Tous les scellés physiques et puces NFC sont-ils validés en coffre ?' },
    ],
    default: [
        { id: '1', title: 'Aide & Raccourcis', prompt: 'Quelles sont les fonctionnalités clés disponibles sur cet écran ?' },
        { id: '2', title: 'Alerte Maintenance', prompt: 'Je souhaite déclarer un incident ou une panne sur un équipement.' },
        { id: '3', title: 'Planning Équipe', prompt: 'Qui est en service sur le shift actuel ?' },
    ],
};

function resolvePathKey(path: string): SuggestionKey {
    if (path.includes('/pos') || path.includes('/caisse')) return 'pos';
    if (path.includes('/inventory') || path.includes('/stock') || path.includes('/logistics')) return 'inventory';
    if (path.includes('/finance') || path.includes('/fec') || path.includes('/comptabilite')) return 'finance';
    if (path.includes('/luxury') || path.includes('/vault')) return 'luxury';
    return 'default';
}

export function useUniversalAssistant() {
    const pathname = usePathname();
    const [viewMode, setViewMode] = useState<AssistantViewMode>('COLLAPSED');
    const [activeTab, setActiveTab] = useState<AssistantTab>('chat');
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setViewMode(prev => (prev === 'COLLAPSED' ? 'DOCK_RIGHT' : 'COLLAPSED'));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getContextSuggestions = useCallback(
        () => PATH_SUGGESTIONS[resolvePathKey(pathname || '')],
        [pathname]
    );

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isProcessing) return;
        setMessages(prev => [...prev, { id: `USR-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date() }]);
        setIsProcessing(true);
        setError(null);
        try {
            const data = await oracleFetch<OracleResponse>({ prompt: text.trim(), context: { currentPath: pathname }, history: messages.map(m => ({ role: m.role, content: m.content })) });
            setMessages(prev => [...prev, { id: `AST-${Date.now()}`, role: 'assistant', content: data.content ?? 'Je n\'ai pas pu générer de réponse.', timestamp: new Date(), suggestedActions: data.suggestedActions, variant: data.variant, roleLevel: data.roleLevel }]);
        } catch (e) {
            logger.error('[useUniversalAssistant] Error:', e);
            setError((e as Error).message ?? 'Une erreur est survenue.');
        } finally {
            setIsProcessing(false);
        }
    }, [messages, isProcessing, pathname]);

    const executeAction = useCallback(async (proposal: ActionProposal): Promise<void> => {
        const data = await oracleFetch<unknown>({ executeAction: { toolId: proposal.toolId, params: proposal.params } });
        setMessages(prev => prev.map(msg => !msg.suggestedActions ? msg : {
            ...msg,
            suggestedActions: msg.suggestedActions.map(a => a.id === proposal.id ? { ...a, status: 'executed' as const } : a),
        }));
        logger.info('[useUniversalAssistant] Action executed:', data);
    }, []);

    const clearSession = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        messages,
        isProcessing,
        error,
        sendMessage,
        executeAction,
        clearSession,
        contextSuggestions: getContextSuggestions(),
    };
}
