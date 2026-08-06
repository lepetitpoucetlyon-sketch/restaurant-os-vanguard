import { TenantConfig } from "@shared/nexus-contract";

export const RETAIL_FULL_DNA: TenantConfig = {
  id: 'retail_golden_seed_complete',
  variant: 'retail',
  capabilities: {
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': false,

    // Caisse + rayons
    'mod_pos': true,
    'mod_floor_plan': true,
    'mod_kds': false,
    'mod_pms': false,

    // Clients & fidélité
    'mod_reservations': false,
    'mod_omnichannel': true,
    'mod_customer': true,
    'mod_quotes': false,
    'mod_groups': false,

    // Stock — cœur du métier
    'mod_kitchen_management': false,
    'mod_bar': false,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': false,
    'mod_quality_control': false,

    // Équipe
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': true,

    // Analytics & marketing
    'mod_analytics': true,
    'mod_google_analytics': true,
    'mod_social_marketing': true,
    'mod_ai_referencing': false,
    'mod_seo': true,

    // Finance
    'mod_treasury': true,
    'mod_accounting_management': true,

    'mod_registre': false,
    'mod_settings': true,
    'mod_access_management': true,
    'mod_fleet_management': false,
    'mod_agent_dashboard': false,
  },
  features: {
    pos: true,
    kds: false,
    inventory: true,
    hr: true,
    reservations: false,
    finance: true,
    marketing: true,
  },
  theme: {
    primaryColor: '#27AE60',
    secondaryColor: '#2ECC71',
    logoUrl: '/default-retail-logo.svg',
    borderRadius: '8px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'RETAIL_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate_standard': 20.0,
      'tax_rate_reduced': 5.5,
      'currency': 'EUR',
      'barcode_enabled': true,
      'node_capacity': 500,
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
    name: 'Retail Complete Matrix',
    version: '1.0.0-retail',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
