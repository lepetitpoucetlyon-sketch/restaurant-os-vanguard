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

export function useUniversalAssistant() {
    const pathname = usePathname();
    const [viewMode, setViewMode] = useState<AssistantViewMode>('COLLAPSED');
    const [activeTab, setActiveTab] = useState<AssistantTab>('chat');
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Toggle raccourci clavier Cmd+K / Ctrl+K
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

    // Suggestions dynamiques en fonction de la page active
    const getContextSuggestions = useCallback((): ContextualSuggestion[] => {
        const path = pathname || '';

        if (path.includes('/pos') || path.includes('/caisse')) {
            return [
                { id: '1', title: 'Verrouiller une table', prompt: 'Peux-tu verrouiller la table 4 pour une arrivée VIP ?' },
                { id: '2', title: 'Procédure avoir/remise', prompt: 'Comment enregistrer un geste commercial ou un avoir sur une addition ?' },
                { id: '3', title: 'Articles en rupture', prompt: 'Quels sont les articles actuellement en rupture de stock ?' },
            ];
        }

        if (path.includes('/inventory') || path.includes('/stock') || path.includes('/logistics')) {
            return [
                { id: '1', title: 'DLC & Alertes Péremption', prompt: 'Quels ingrédients arrivent à péremption dans les prochaines 48 heures ?' },
                { id: '2', title: 'Commande Fournisseur', prompt: 'Prépare une commande fournisseur pour les articles en seuil critique.' },
                { id: '3', title: 'Écart de portionnement', prompt: 'Y a-t-il des anomalies récentes de coût matière sur les fiches techniques ?' },
            ];
        }

        if (path.includes('/finance') || path.includes('/fec') || path.includes('/comptabilite')) {
            return [
                { id: '1', title: 'Synthèse CA du jour', prompt: 'Donne-moi la synthèse du chiffre d\'affaires encaissé aujourd\'hui par mode de paiement.' },
                { id: '2', title: 'Vérification NF525', prompt: 'Le registre de scellement fiscal est-il 100% synchronisé et intègre ?' },
                { id: '3', title: 'TVA CA3 prévisionnelle', prompt: 'Quel est le montant estimé de TVA collectée sur la période en cours ?' },
            ];
        }

        if (path.includes('/luxury') || path.includes('/vault')) {
            return [
                { id: '1', title: 'Cote Marché Sacs', prompt: 'Quelle est l\'évolution de la cote du Hermès Birkin 30 Crocodile ?' },
                { id: '2', title: 'Rendement Locatif', prompt: 'Quel est le rendement locatif moyen versé aux investisseurs ce mois-ci ?' },
                { id: '3', title: 'Statut Chambre Forte', prompt: 'Tous les scellés physiques et puces NFC sont-ils validés en coffre ?' },
            ];
        }

        // Suggestions générales par défaut
        return [
            { id: '1', title: 'Aide & Raccourcis', prompt: 'Quelles sont les fonctionnalités clés disponibles sur cet écran ?' },
            { id: '2', title: 'Alerte Maintenance', prompt: 'Je souhaite déclarer un incident ou une panne sur un équipement.' },
            { id: '3', title: 'Planning Équipe', prompt: 'Qui est en service sur le shift actuel ?' },
        ];
    }, [pathname]);

    // Envoi de message
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isProcessing) return;

        const userMsg: AssistantMessage = {
            id: `USR-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/oracle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text.trim(),
                    context: { currentPath: pathname },
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Erreur de communication avec le Copilote.');
            }

            const data = await response.json() as {
                content: string;
                suggestedActions?: ActionProposal[];
                variant?: string;
                roleLevel?: number;
            };

            const assistantMsg: AssistantMessage = {
                id: `AST-${Date.now()}`,
                role: 'assistant',
                content: data.content || 'Je n\'ai pas pu générer de réponse.',
                timestamp: new Date(),
                suggestedActions: data.suggestedActions,
                variant: data.variant,
                roleLevel: data.roleLevel,
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (e) {
            const err = e as Error;
            logger.error('[useUniversalAssistant] Error:', err);
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setIsProcessing(false);
        }
    }, [messages, isProcessing, pathname]);

    // Exécution d'une action proposée
    const executeAction = useCallback(async (proposal: ActionProposal): Promise<void> => {
        const response = await fetch('/api/oracle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                executeAction: {
                    toolId: proposal.toolId,
                    params: proposal.params,
                },
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Échec de l\'exécution de l\'action.');
        }

        const data = await response.json();
        
        // Mettre à jour l'état local du message pour refléter l'exécution
        setMessages(prev => prev.map(msg => {
            if (!msg.suggestedActions) return msg;
            return {
                ...msg,
                suggestedActions: msg.suggestedActions.map(a => 
                    a.id === proposal.id ? { ...a, status: 'executed' as const } : a
                ),
            };
        }));

        logger.info('[useUniversalAssistant] Action executed successfully:', data);
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
