import { TenantConfig } from "@shared/nexus-contract";

export const BAKERY_FULL_DNA: TenantConfig = {
  id: 'bakery_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'bakery',
  capabilities: {
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': true,

    // Comptoir + production boulangerie
    'mod_pos': true,
    'mod_floor_plan': false,
    'mod_kds': true,
    'mod_pms': false,

    // Clients & fidélité
    'mod_reservations': false,
    'mod_omnichannel': false,
    'mod_customer': true,
    'mod_quotes': false,
    'mod_groups': false,

    // Production — cuisson, recettes, HACCP obligatoire
    'mod_kitchen_management': true,
    'mod_bar': false,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': true,
    'mod_quality_control': true,

    // Équipe
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': false,

    // Analytics
    'mod_analytics': true,
    'mod_google_analytics': false,
    'mod_social_marketing': false,
    'mod_ai_referencing': false,
    'mod_seo': false,

    // Finance
    'mod_treasury': true,
    'mod_accounting_management': true,

    // Légal
    'mod_registre': true,

    // Admin
    'mod_settings': true,
    'mod_access_management': true,
    'mod_fleet_management': false,
    'mod_agent_dashboard': false,
  },
  features: {
    pos: true,
    kds: true,
    inventory: true,
    hr: true,
    reservations: false,
    finance: true,
    marketing: false,
  },
  theme: {
    primaryColor: '#C68642',
    secondaryColor: '#8B4513',
    logoUrl: '/default-bakery-logo.svg',
    borderRadius: '12px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'BAKERY_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate_food': 5.5,
      'tax_rate_hot': 10.0,
      'currency': 'EUR',
      'haccp_required': true,
      'node_capacity': 100,
      'fiscal_coefficient': 1.0,
      'pmsEnabled': false,
    },
    economy: {
      basePrice: 0,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: 'Boulangerie Complete Matrix',
    version: '1.0.0-bakery',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
