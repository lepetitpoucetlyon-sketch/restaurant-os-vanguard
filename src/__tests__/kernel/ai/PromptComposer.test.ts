import { describe, it, expect } from 'vitest';
import { PromptComposer } from '@/kernel/ai/core/PromptComposer';
import type { VerticalAIPrompts } from '@/kernel/ai/core/types';

const BAKERY_PROMPTS: VerticalAIPrompts = {
    systemPersona: "Tu es un assistant expert en boulangerie-pâtisserie artisanale.",
    vocabulary: {
        fournée: "production par cuisson, batch four",
        DLC: "Date Limite de Consommation",
        vitrine: "présentoir produits, stock boutique",
    },
    examples: [
        { user: "Combien de baguettes en vitrine ?", assistant: "Je consulte le stock vitrine en temps réel." },
    ],
    forbiddenActions: ["Modifier une DLC déjà enregistrée"],
    complianceContext: "Loi Garot (2016) : anti-gaspillage. HACCP obligatoire.",
};

const SALON_PROMPTS: VerticalAIPrompts = {
    systemPersona: "Tu es un assistant expert en salon de coiffure.",
    vocabulary: {
        "rendez-vous": "booking client, RDV praticien",
        forfait: "prestation packagée",
        praticien: "coiffeur, esthéticienne",
    },
};

describe('PromptComposer', () => {
    // ── composeMCC ────────────────────────────────────────────

    it('composeMCC retourne le prompt de base', () => {
        const result = PromptComposer.composeMCC({ base: 'Prompt MCC de base' });
        expect(result).toContain('Prompt MCC de base');
    });

    it('composeMCC inclut le contexte si fourni', () => {
        const result = PromptComposer.composeMCC({
            base: 'Analyse ce ticket',
            context: { tenantId: 'brasserie-01', ticketId: 'tk-001' },
        });
        expect(result).toContain('brasserie-01');
        expect(result).toContain('tk-001');
    });

    it('R2 — composeMCC ne contient AUCUN nom de vertical hardcodé', () => {
        const PLATFORM_VARIANTS = [
            'restaurant', 'hotel', 'bakery', 'garage', 'salon',
            'clinic', 'retail', 'gym', 'coworking', 'veterinary', 'florist',
        ];
        const result = PromptComposer.composeMCC({
            base: 'Analyse le problème',
            context: { description: 'Problème caisse' },
        });
        for (const variant of PLATFORM_VARIANTS) {
            expect(result).not.toContain(`'${variant}'`);
            expect(result).not.toContain(`"${variant}"`);
        }
    });

    // ── composeTenant avec vertical layer ─────────────────────

    it('composeTenant("bakery") contient persona boulanger', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
            verticalLayer: BAKERY_PROMPTS,
        });
        expect(result).toContain('boulangerie');
        expect(result).toContain('fournée');
        expect(result).toContain('Loi Garot');
    });

    it('composeTenant("salon") contient vocab coiffure et PAS boulanger', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
            verticalLayer: SALON_PROMPTS,
        });
        expect(result).toContain('rendez-vous');
        expect(result).toContain('praticien');
        expect(result).not.toContain('fournée');
        expect(result).not.toContain('boulangerie');
    });

    it('composeTenant contient les few-shot examples', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
            verticalLayer: BAKERY_PROMPTS,
        });
        expect(result).toContain('Combien de baguettes en vitrine ?');
        expect(result).toContain('Je consulte le stock vitrine en temps réel.');
    });

    it('composeTenant contient les forbiddenActions', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
            verticalLayer: BAKERY_PROMPTS,
        });
        expect(result).toContain('Modifier une DLC');
    });

    it('composeTenant inclut le contexte tenant', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
            verticalLayer: BAKERY_PROMPTS,
            tenantContext: { userId: 'user-123', section: 'caisse' },
        });
        expect(result).toContain('user-123');
        expect(result).toContain('caisse');
    });

    it('composeTenant fonctionne sans verticalLayer (mode dégradé)', () => {
        const result = PromptComposer.composeTenant({
            base: 'Aide le gérant',
        });
        expect(result).toBe('Aide le gérant');
    });

    it('Extensibilité — une vertical fake "pharmacy" fonctionne sans modif kernel', () => {
        const PHARMACY_PROMPTS: VerticalAIPrompts = {
            systemPersona: "Tu es un assistant expert en pharmacie.",
            vocabulary: {
                ordonnance: "prescription médicale",
                générique: "médicament générique, bioéquivalent",
            },
            complianceContext: "Pharmacovigilance obligatoire.",
        };

        const result = PromptComposer.composeTenant({
            base: 'Aide le pharmacien',
            verticalLayer: PHARMACY_PROMPTS,
        });

        expect(result).toContain('pharmacie');
        expect(result).toContain('ordonnance');
        expect(result).toContain('Pharmacovigilance');
        // Aucune modif kernel nécessaire
    });

    // ── Structure composition ─────────────────────────────────

    it('La composition tenant respecte l\'ordre [base, persona, vocab, examples, compliance, context]', () => {
        const result = PromptComposer.composeTenant({
            base: 'BASE',
            verticalLayer: BAKERY_PROMPTS,
            tenantContext: { user: 'Jean' },
        });

        const basePos = result.indexOf('BASE');
        const personaPos = result.indexOf('boulangerie');
        const vocabPos = result.indexOf('fournée');
        const examplePos = result.indexOf('Combien de baguettes');
        const compliancePos = result.indexOf('Loi Garot');
        const contextPos = result.indexOf('Jean');

        expect(basePos).toBeLessThan(personaPos);
        expect(personaPos).toBeLessThan(vocabPos);
        expect(vocabPos).toBeLessThan(examplePos);
        expect(examplePos).toBeLessThan(compliancePos);
        expect(compliancePos).toBeLessThan(contextPos);
    });
});
