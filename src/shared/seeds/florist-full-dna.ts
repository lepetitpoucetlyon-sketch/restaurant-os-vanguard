import { TenantConfig } from "@/shared/nexus/contracts";

export const FLORIST_FULL_DNA: TenantConfig = {
  id: 'florist_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'florist',
  capabilities: {
    mod_dashboard: true,
    mod_executive_intelligence: true,
    mod_system_map: false,

    // Caisse & vente au comptoir
    mod_pos: true,
    mod_floor_plan: false,
    mod_kds: false,
    mod_pms: false,

    // Commandes évènement, mariages & livraisons
    mod_reservations: true,
    mod_omnichannel: true,
    mod_customer: true,
    mod_quotes: true,
    mod_groups: true,

    // Périssables, fleurs coupées & stockage chambre froide
    mod_kitchen_management: false,
    mod_bar: false,
    mod_storage_map: true,
    mod_inventory: true,
    mod_haccp: false,
    mod_quality_control: false,

    // Équipe & fleuristes
    mod_onboarding: true,
    mod_hr: true,
    mod_planning: true,
    mod_leaves: true,
    mod_recruitment: false,

    // Marketing & compositions
    mod_analytics: true,
    mod_google_analytics: false,
    mod_social_marketing: true,
    mod_ai_referencing: false,
    mod_seo: false,

    // Finance & facturation
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
    primaryColor: '#10B981',
    secondaryColor: '#064E3B',
    logoUrl: '/brands/florist-logo.svg',
    borderRadius: '12px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'FLORIST_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'perishables_enabled': true,
      'node_capacity': 30,
      'fiscal_coefficient': 1.0,
      'pmsEnabled': false,
    },
    economy: {
      basePrice: 79.0,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: 'Atelier Floral & Botanique',
    version: '1.0.0-florist',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
