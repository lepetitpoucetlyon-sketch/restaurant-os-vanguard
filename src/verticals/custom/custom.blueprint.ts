import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale CUSTOM (Profil H — Concept Store Hybride / Générique).
 */
export const CUSTOM_BLUEPRINT: VerticalBlueprint = {
  slug: 'custom',
  className: 'CustomVertical',
  profile: 'H',
  meta: {
    emoji: '✨',
    label: 'Personnalisé',
    name: 'Custom OS',
    description: 'Structure universelle modulaire configurable par feature-flags',
  },
  capabilities: {
    mod_dashboard: true,
    mod_settings: true,
    mod_access_management: true,
    mod_brand_basic: true,
    mod_pos: true,
    mod_customer: true,
    mod_treasury: true,
    mod_accounting_management: true,
    mod_rgpd: true,
    mod_analytics: true,
    mod_hr: true,
    mod_planning: true,
    mod_onboarding: true,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#6366F1',
      primaryHover: '#4F46E5',
      accentColor: '#8B5CF6',
      borderRadiusCard: 'md',
      borderRadiusBtn: 'md',
      glassBlur: 'md',
      glassOpacity: 'medium',
      fontBrand: 'Inter',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {},
  },
  healthMetrics: { customNodes: 'number' },
  routes: [],
  events: [],
  hardware: ['receipt_printer', 'cash_drawer', 'card_terminal'],
  legalType: 'GENERIC',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Custom Generic Matrix',
    businessLaws: { modular_switchboard_enabled: true },
  },
  precision: 'L0',
  subVariants: [],
};
