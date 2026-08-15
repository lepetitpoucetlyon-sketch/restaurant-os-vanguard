import { describe, it, expect } from 'vitest';
import { UniversalSystemPromptBuilder, VERTICAL_LABELS_MAP } from '@/modules/intelligence/services/UniversalSystemPromptBuilder';
import { AssistantActionDispatcher } from '@/modules/intelligence/services/AssistantActionDispatcher';

describe('🤖 Universal Assistant & RBAC Membrane Suite', () => {
    describe('1. Dynamic Role Level Resolution (10 to 100)', () => {
        it('maps executive and ownership roles to Level 100 and 90', () => {
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('super_admin')).toBe(100);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('owner')).toBe(100);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('proprietaire')).toBe(100);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('directeur')).toBe(90);
        });

        it('maps management and accounting roles to Level 70 and 60', () => {
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('manager')).toBe(70);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('responsable_site')).toBe(70);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('comptable')).toBe(60);
        });

        it('maps operational cross-sector roles to Level 40', () => {
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('serveur')).toBe(40);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('mecanicien')).toBe(40);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('vendeur')).toBe(40);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('coiffeur')).toBe(40);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('receptionniste')).toBe(40);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('cuisinier')).toBe(40);
        });

        it('maps apprentices and entry roles to Level 10', () => {
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('apprenti')).toBe(10);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('stagiaire')).toBe(10);
            expect(UniversalSystemPromptBuilder.resolveRoleLevel('plongeur')).toBe(10);
        });
    });

    describe('2. Multi-Vertical Prompt Customization', () => {
        it('customizes prompt for Restaurant vertical without hardcoded leaks', () => {
            const prompt = UniversalSystemPromptBuilder.build({
                variant: 'restaurant',
                role: 'serveur',
                roleLevel: 40,
            });

            expect(prompt).toContain('Restaurant & Brasserie');
            expect(prompt).toContain('couvert / plat');
            expect(prompt).toContain('table / salle');
            expect(prompt).toContain('Niveau d\'habilitation RBAC : **40/100**');
        });

        it('customizes prompt for Garage vertical', () => {
            const prompt = UniversalSystemPromptBuilder.build({
                variant: 'garage',
                role: 'mecanicien',
                roleLevel: 40,
            });

            expect(prompt).toContain('Garage & Atelier Mécanique');
            expect(prompt).toContain('heure MO / pièce détachée');
            expect(prompt).toContain('baie de travail / pont élévateur');
            expect(prompt).toContain('immatriculation SIV');
        });

        it('customizes prompt for Clinic vertical', () => {
            const prompt = UniversalSystemPromptBuilder.build({
                variant: 'clinic',
                role: 'praticien',
                roleLevel: 50,
            });

            expect(prompt).toContain('Clinique & Cabinet Médical');
            expect(prompt).toContain('acte médical (CCAM)');
            expect(prompt).toContain('dossier consultation / feuille de soins');
        });

        it('customizes prompt for Luxury Vault vertical', () => {
            const prompt = UniversalSystemPromptBuilder.build({
                variant: 'luxury_vault',
                role: 'curator',
                roleLevel: 50,
            });

            expect(prompt).toContain('Investissement & Coffre Sacs de Luxe');
            expect(prompt).toContain('part / fraction d\'actif');
            expect(prompt).toContain('coffre-fort / chambre forte blindée');
        });
    });

    describe('3. Assistant Tool Execution & RBAC Authorization Membrane', () => {
        it('blocks Level 40 operator from executing financial snapshot tool (requires Level 70)', () => {
            const result = AssistantActionDispatcher.createActionProposal(
                'query_financial_snapshot',
                { period: 'today', metric: 'margin' },
                40 // Level 40
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Permissions insuffisantes');
            expect(result.proposal).toBeUndefined();
        });

        it('authorizes Level 70 manager to execute financial snapshot tool', () => {
            const result = AssistantActionDispatcher.createActionProposal(
                'query_financial_snapshot',
                { period: 'today', metric: 'margin' },
                70 // Level 70
            );

            expect(result.success).toBe(true);
            expect(result.proposal).toBeDefined();
            expect(result.proposal?.toolId).toBe('query_financial_snapshot');
            expect(result.proposal?.status).toBe('proposed');
        });

        it('authorizes Level 40 operator to lock a table or space', () => {
            const result = AssistantActionDispatcher.createActionProposal(
                'lock_space_or_table',
                { spaceId: 'table-12', reason: 'Réservation VIP' },
                40
            );

            expect(result.success).toBe(true);
            expect(result.proposal?.toolId).toBe('lock_space_or_table');
        });

        it('redacts PII from tool parameters automatically', () => {
            const result = AssistantActionDispatcher.createActionProposal(
                'create_maintenance_ticket',
                {
                    equipmentName: 'TPE 01',
                    severity: 'critical',
                    description: 'Contact client jean.dupont@email.com avec CB 4970-1234-5678-9012 en panne',
                },
                50
            );

            expect(result.success).toBe(true);
            const desc = result.proposal?.params.description as string;
            expect(desc).not.toContain('jean.dupont@email.com');
            expect(desc).not.toContain('4970-1234-5678-9012');
            expect(desc).toContain('j***@email.com');
            expect(desc).toContain('****-****-****-9012');
        });
    });
});
