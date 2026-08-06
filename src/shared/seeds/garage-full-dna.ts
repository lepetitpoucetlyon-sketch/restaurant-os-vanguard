import { TenantConfig } from "@shared/nexus-contract";

export const GARAGE_FULL_DNA: TenantConfig = {
  id: 'garage_golden_seed_complete',
  variant: 'garage',
  capabilities: {
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': false,

    // Caisse + devis
    'mod_pos': true,
    'mod_floor_plan': false,
    'mod_kds': false,
    'mod_pms': false,

    // Clients & rdv
    'mod_reservations': true,
    'mod_omnichannel': false,
    'mod_customer': true,
    'mod_quotes': true,
    'mod_groups': false,

    // Production
    'mod_kitchen_management': false,
    'mod_bar': false,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': false,
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

    'mod_registre': true,
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
    reservations: true,
    finance: true,
    marketing: false,
  },
  theme: {
    primaryColor: '#2C3E50',
    secondaryColor: '#E74C3C',
    logoUrl: '/default-garage-logo.svg',
    borderRadius: '4px',
    appearance: 'dark',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'GARAGE_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'quotes_required': true,
      'node_capacity': 20,
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
    name: 'Garage Complete Matrix',
    version: '1.0.0-garage',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
