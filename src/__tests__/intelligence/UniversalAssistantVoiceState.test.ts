import { describe, it, expect } from 'vitest';
import { getDefaultStore } from 'jotai';
import {
    assistantMessagesAtom,
    assistantVoiceStateAtom,
    assistantToolStateAtom,
    assistantViewModeAtom,
} from '@/store/assistantAtoms';
import { UNIVERSAL_ASSISTANT_TOOLS, AssistantActionDispatcher } from '@/modules/intelligence/services/AssistantActionDispatcher';

describe('Intelligence & Copilote Vocal — État Global & Function Calling', () => {
    it('devrait initialiser le store global Jotai avec l\'état vocal et persistant', () => {
        const store = getDefaultStore();

        const messages = store.get(assistantMessagesAtom);
        const voiceState = store.get(assistantVoiceStateAtom);
        const toolState = store.get(assistantToolStateAtom);
        const viewMode = store.get(assistantViewModeAtom);

        expect(messages.length).toBeGreaterThan(0);
        expect(messages[0].role).toBe('assistant');
        expect(voiceState.isListening).toBe(false);
        expect(voiceState.isSpeaking).toBe(false);
        expect(toolState.status).toBe('idle');
        expect(viewMode).toBe('COLLAPSED');
    });

    it('devrait exposer les outils de consultation opérationnelle pour le Chatbot Vocal', () => {
        expect(UNIVERSAL_ASSISTANT_TOOLS.get_stock_by_location).toBeDefined();
        expect(UNIVERSAL_ASSISTANT_TOOLS.get_stock_by_location.parameters[0].name).toBe('locationName');

        expect(UNIVERSAL_ASSISTANT_TOOLS.query_financial_snapshot).toBeDefined();
        expect(UNIVERSAL_ASSISTANT_TOOLS.get_latest_supplier_invoices).toBeDefined();
        expect(UNIVERSAL_ASSISTANT_TOOLS.get_haccp_temperatures).toBeDefined();
    });

    it('devrait valider et créer une proposition d\'action pour la consultation du frigo N°4', () => {
        const result = AssistantActionDispatcher.createActionProposal(
            'get_stock_by_location',
            { locationName: 'Frigo 4' },
            50 // Manager Role Level
        );

        expect(result.success).toBe(true);
        expect(result.proposal?.title).toBe('Consultation Stock par Emplacement');
        expect(result.proposal?.params.locationName).toBe('Frigo 4');
        expect(result.proposal?.status).toBe('proposed');
    });

    it('devrait bloquer un outil financier de niveau supérieur si le rôle est insuffisant', () => {
        const result = AssistantActionDispatcher.createActionProposal(
            'trigger_stock_reorder',
            { itemId: 'ITEM_123', quantity: 50 },
            10 // Simple opérateur
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Permissions insuffisantes');
    });
});
