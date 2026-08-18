import { TenantConfig } from '@shared/nexus-contract';

export const COWORKING_FULL_DNA: TenantConfig = {
  id: 'coworking_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'coworking',
  capabilities: {
    mod_dashboard: true,
    mod_executive_intelligence: true,
    mod_system_map: false,

    // Caisse & pass journalier
    mod_pos: true,
    mod_floor_plan: true,
    mod_kds: false,
    mod_pms: false,

    // Réservation bureaux, salles & pass
    mod_reservations: true,
    mod_omnichannel: false,
    mod_customer: true,
    mod_quotes: true,
    mod_groups: true,

    // Matériel & consommables
    mod_kitchen_management: false,
    mod_bar: false,
    mod_storage_map: true,
    mod_inventory: true,
    mod_haccp: false,
    mod_quality_control: false,

    // Équipe & accueil
    mod_onboarding: true,
    mod_hr: true,
    mod_planning: true,
    mod_leaves: true,
    mod_recruitment: false,

    // Analytics
    mod_analytics: true,
    mod_google_analytics: false,
    mod_social_marketing: true,
    mod_ai_referencing: false,
    mod_seo: false,

    // Facturation récurrente
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
    primaryColor: '#6366F1',
    secondaryColor: '#1E1B4B',
    logoUrl: '/brands/coworking-logo.svg',
    borderRadius: '12px',
    appearance: 'dark',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'COWORKING_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'desks_capacity': 80,
      'node_capacity': 100,
      'fiscal_coefficient': 1.0,
      'pmsEnabled': false,
    },
    economy: {
      basePrice: 99.0,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: 'Nexus Hive Coworking',
    version: '1.0.0-coworking',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
