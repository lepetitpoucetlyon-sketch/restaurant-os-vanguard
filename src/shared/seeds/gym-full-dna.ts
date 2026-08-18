import { TenantConfig } from '@shared/nexus-contract';

export const GYM_FULL_DNA: TenantConfig = {
  id: 'gym_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'gym',
  capabilities: {
    mod_dashboard: true,
    mod_executive_intelligence: true,
    mod_system_map: false,

    // Caisse & contrôle d'accès
    mod_pos: true,
    mod_floor_plan: false,
    mod_kds: false,
    mod_pms: false,

    // Abonnements, membres & cours
    mod_reservations: true,
    mod_omnichannel: false,
    mod_customer: true,
    mod_quotes: true,
    mod_groups: true,

    // Équipements & boissons
    mod_kitchen_management: false,
    mod_bar: false,
    mod_storage_map: true,
    mod_inventory: true,
    mod_haccp: false,
    mod_quality_control: false,

    // Équipe & coachs
    mod_onboarding: true,
    mod_hr: true,
    mod_planning: true,
    mod_leaves: true,
    mod_recruitment: false,

    // Analytics & fidélité
    mod_analytics: true,
    mod_google_analytics: false,
    mod_social_marketing: true,
    mod_ai_referencing: false,
    mod_seo: false,

    // Finance & abonnements SEPA
    mod_treasury: true,
    mod_accounting_management: true,

    mod_registre: false,
    mod_settings: true,
    mod_access_management: true,
    mod_fleet_management: false,
    mod_agent_dashboard: false,
  },
  features: {
    pos: true,
    kds: false,
    inventory: true,
    reservations: true,
    hr: true,
    accounting: true,
  },
  theme: {
    primaryColor: '#EF4444',
    secondaryColor: '#1F2937',
    logoUrl: '/brands/gym-logo.svg',
    borderRadius: '12px',
    appearance: 'dark',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'GYM_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'members_capacity': 500,
      'node_capacity': 100,
      'fiscal_coefficient': 1.0,
      'pmsEnabled': false,
    },
    economy: {
      basePrice: 49.0,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: 'Fitness Club Premium',
    version: '1.0.0-gym',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
