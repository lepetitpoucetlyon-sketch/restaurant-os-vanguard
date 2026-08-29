import { TenantConfig } from "@/shared/nexus/contracts";

export const SALON_FULL_DNA: TenantConfig = {
  id: 'salon_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'salon',
  capabilities: {
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': false,

    // Agenda + vente produits
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

    // Production — pas de cuisine
    'mod_kitchen_management': false,
    'mod_bar': false,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': false,
    'mod_quality_control': false,

    // Équipe & planning
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': false,

    // Analytics & fidélité
    'mod_analytics': true,
    'mod_google_analytics': false,
    'mod_social_marketing': true,
    'mod_ai_referencing': false,
    'mod_seo': false,

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
    reservations: true,
    finance: true,
    marketing: true,
  },
  theme: {
    primaryColor: '#D4A5C7',
    secondaryColor: '#9B59B6',
    logoUrl: '/default-salon-logo.svg',
    borderRadius: '16px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'SALON_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'appointments_enabled': true,
      'node_capacity': 50,
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
    name: 'Salon Complete Matrix',
    version: '1.0.0-salon',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
