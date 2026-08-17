import { describe, it, expect } from 'vitest';
import { 
    UNIVERSAL_ASSISTANT_TOOLS, 
    AssistantActionDispatcher, 
    ActionProposal 
} from '@/modules/intelligence/services/AssistantActionDispatcher';

describe('🏛️ Universal Assistant — Matrice Multi-Verticales & Membrane RBAC', () => {

    describe('1. Couverture des 8 Verticales Métier', () => {
        it('🍽️ Restaurant : dispose des outils de séquence KDS et relevé de stock/température', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.fire_course_sequence).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.fire_course_sequence.minRoleLevel).toBe(40);
            expect(UNIVERSAL_ASSISTANT_TOOLS.get_stock_by_location.minRoleLevel).toBe(20);
            expect(UNIVERSAL_ASSISTANT_TOOLS.get_haccp_temperatures.minRoleLevel).toBe(20);
        });

        it('🥖 Boulangerie : dispose des outils de fournée, balance Dialogue 06 et TooGoodToGo', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.schedule_baking_batch).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.schedule_baking_batch.minRoleLevel).toBe(40);
            expect(UNIVERSAL_ASSISTANT_TOOLS.read_scale_weight.minRoleLevel).toBe(20);
            expect(UNIVERSAL_ASSISTANT_TOOLS.publish_tgtg_basket.minRoleLevel).toBe(50);
        });

        it('🛍️ Retail : dispose des outils de scan EAN13 et de réassort', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.scan_and_check_ean).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.trigger_boutique_restock).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.trigger_boutique_restock.minRoleLevel).toBe(40);
        });

        it('💇 Salon : dispose des créneaux cabines et réservation forfaits', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.check_chair_availability).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.book_client_treatment).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.book_client_treatment.minRoleLevel).toBe(40);
        });

        it('🚗 Garage : dispose des ordres de réparation et bordereaux BSDD', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.query_repair_order).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.track_waste_bsdd).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.track_waste_bsdd.minRoleLevel).toBe(50);
        });

        it('🏨 Hôtel : dispose du rack PMS et des fiches de police CESEDA', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.query_room_rack).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.generate_police_sheet).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.generate_police_sheet.minRoleLevel).toBe(40);
        });

        it('🩺 Clinique : dispose du planning praticiens et vérification HDS', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.query_practitioner_agenda).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.verify_hds_consent).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.verify_hds_consent.minRoleLevel).toBe(50);
        });

        it('💼 Luxury Vault : dispose de la vérification de scellé et cote d\'actif', () => {
            expect(UNIVERSAL_ASSISTANT_TOOLS.verify_luxury_asset_seal).toBeDefined();
            expect(UNIVERSAL_ASSISTANT_TOOLS.verify_luxury_asset_seal.minRoleLevel).toBe(40);
        });
    });

    describe('2. Membrane RBAC Zéro-Trust & Validation des Niveaux', () => {
        it('devrait autoriser un boulanger L40 à planifier une fournée mais refuser un commis L10', () => {
            const allowed = AssistantActionDispatcher.createActionProposal(
                'schedule_baking_batch',
                { recipeId: 'Baguette Tradition', quantity: 80 },
                40
            );
            expect(allowed.success).toBe(true);
            expect(allowed.proposal?.title).toBe('Programmation Fournée & Cuisson');

            const blocked = AssistantActionDispatcher.createActionProposal(
                'schedule_baking_batch',
                { recipeId: 'Baguette Tradition', quantity: 80 },
                10
            );
            expect(blocked.success).toBe(false);
            expect(blocked.error).toContain('Permissions insuffisantes');
        });

        it('devrait bloquer la génération de bordereau BSDD Garage (L50) pour un simple mécanicien L40', () => {
            const blocked = AssistantActionDispatcher.createActionProposal(
                'track_waste_bsdd',
                { wasteType: 'huiles_moteur', volume: 100 },
                40
            );
            expect(blocked.success).toBe(false);
            expect(blocked.error).toContain('Permissions insuffisantes');

            const allowed = AssistantActionDispatcher.createActionProposal(
                'track_waste_bsdd',
                { wasteType: 'huiles_moteur', volume: 100 },
                50
            );
            expect(allowed.success).toBe(true);
        });

        it('devrait bloquer la consultation financière globale (L70) pour un opérateur L40', () => {
            const blocked = AssistantActionDispatcher.createActionProposal(
                'query_financial_snapshot',
                { period: 'yesterday' },
                40
            );
            expect(blocked.success).toBe(false);
            expect(blocked.error).toContain('Permissions insuffisantes');

            const allowed = AssistantActionDispatcher.createActionProposal(
                'query_financial_snapshot',
                { period: 'yesterday' },
                70
            );
            expect(allowed.success).toBe(true);
        });
    });

    describe('3. Moteur d\'Exécution des Actions Approuvées', () => {
        it('devrait exécuter l\'envoi de suite restaurant et retourner un message clair', async () => {
            const proposal: ActionProposal = {
                id: 'ACT-TEST-01',
                toolId: 'fire_course_sequence',
                title: 'Envoi Suite en Cuisine (KDS)',
                description: 'Envoi plats',
                params: { tableId: '14', course: 'plats' },
                minRoleLevel: 40,
                status: 'proposed',
            };

            const result = await AssistantActionDispatcher.executeAction(proposal, 40);
            expect(result.success).toBe(true);
            expect(result.message).toContain('Table 14');
            expect(result.message).toContain('plats');
        });

        it('devrait exécuter la génération de fiche de police CESEDA hôtel', async () => {
            const proposal: ActionProposal = {
                id: 'ACT-TEST-02',
                toolId: 'generate_police_sheet',
                title: 'Fiche Police',
                description: 'Génération',
                params: { bookingId: 'BK-100', guestName: 'John Doe' },
                minRoleLevel: 40,
                status: 'proposed',
            };

            const result = await AssistantActionDispatcher.executeAction(proposal, 50);
            expect(result.success).toBe(true);
            expect(result.message).toContain('John Doe');
            expect(result.message).toContain('BK-100');
        });

        it('devrait refuser l\'exécution si l\'utilisateur tente d\'outrepasser son rôle à l\'exécution', async () => {
            const proposal: ActionProposal = {
                id: 'ACT-TEST-03',
                toolId: 'publish_tgtg_basket',
                title: 'Publication TGTG',
                description: 'Publication',
                params: { quantity: 5, priceCents: 399 },
                minRoleLevel: 50,
                status: 'proposed',
            };

            const result = await AssistantActionDispatcher.executeAction(proposal, 20); // Role trop bas
            expect(result.success).toBe(false);
            expect(result.message).toContain('Exécution refusée');
        });
    });
});
