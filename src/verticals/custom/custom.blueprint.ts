import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale CUSTOM — canevas vierge (P4).
 *
 * Contrairement aux 11 autres verticales, `custom` ne préjuge d'aucune activité
 * métier : c'est un **squelette minimal** que l'opérateur/agent enrichit à la
 * carte via le `CapabilityWiringRegistry` (P1) et éventuellement les overrides
 * UI tenant (P4).
 *
 * Seules trois capabilities sont pré-activées :
 *  - `mod_dashboard`     : shell d'accueil (sinon aucune page n'est atteignable).
 *  - `mod_settings`      : réglages de base (pour cocher les autres capabilities).
 *  - `mod_brand_basic`   : logo/couleur/favicon (branding minimal, socle du custom UI).
 *
 * Le reste (`mod_pos`, `mod_hr`, `mod_accounting_management`, etc.) est décoché
 * par défaut : l'agent de qualification (P2a) ou l'opérateur active ce qui a du
 * sens pour son besoin exact via le wizard 7 axes. Ainsi, `custom` devient
 * vraiment "à la carte" et n'impose plus 13 modules par défaut comme avant P4.
 */
export const CUSTOM_BLUEPRINT: VerticalBlueprint = {
    slug: 'custom',
    className: 'CustomVertical',
    profile: 'H',
    meta: {
        emoji: '✨',
        label: 'Personnalisé',
        name: 'Custom OS',
        description:
            'Canevas vierge — compose ta plateforme capability par capability via le CapabilityWiringRegistry.',
    },
    capabilities: {
        mod_dashboard: true,
        mod_settings: true,
        mod_brand_basic: true,
    },
    // Custom = canevas vierge : palette NEUTRE zinc/graphite (pas d'AI purple
    // #6366F1 / #8B5CF6 comme avant). Le tenant configure sa charte via
    // BrandingService (Branding Plus) dès l'onboarding, mais un démarrage sans
    // config reste sobre et premium — pas "encore un SaaS violet générique".
    // Fonts : Outfit + Instrument Serif = mêmes défauts que la verticale
    // restaurant (référence) pour cohérence visuelle inter-verticales.
    tokens: {
        appearance: 'dark',
        defaultTokens: {
            primaryColor: '#18181B',
            primaryHover: '#27272A',
            accentColor: '#3F3F46',
            borderRadiusCard: 'md',
            borderRadiusBtn: 'md',
            glassBlur: 'md',
            glassOpacity: 'medium',
            fontBrand: 'Instrument Serif',
            fontUI: 'Outfit',
            fontMono: 'JetBrains Mono',
        },
        verticalTokens: {},
    },
    healthMetrics: { customNodes: 'number' },
    routes: [],
    events: [],
    hardware: [],
    legalType: 'GENERIC',
    dnaOverrides: {
        layoutType: 'sidebar',
        metadataName: 'Custom Generic Matrix',
        businessLaws: { modular_switchboard_enabled: true },
    },
    aiPrompts: {
        systemPersona:
            "Tu es un assistant intelligent pour la gestion d'entreprise. Tu aides les opérateurs dans leurs tâches quotidiennes : questions opérationnelles, analyses, et recommandations. La composition de la plateforme est laissée à l'opérateur — n'imagine pas de fonctionnalités absentes.",
        vocabulary: {
            produit: 'article ou service proposé',
            client: 'acheteur ou bénéficiaire du service',
            commande: 'achat ou demande de service',
            stock: 'inventaire des produits disponibles',
            facture: 'document comptable de facturation',
        },
        examples: [],
        forbiddenActions: [
            'Effectuer une action irréversible sans confirmation',
            'Accéder à des données sans autorisation',
            'Assumer qu\'une capability est active sans vérifier CapabilityWiring',
        ],
        complianceContext:
            'RGPD : protection des données personnelles. TVA applicable selon activité configurée.',
    },
    precision: 'L0',
    subVariants: [],
};
