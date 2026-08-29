import { TenantConfig } from "@/shared/nexus/contracts";

export const VETERINARY_FULL_DNA: TenantConfig = {
  id: 'veterinary_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'veterinary',
  capabilities: {
    mod_dashboard: true,
    mod_executive_intelligence: true,
    mod_system_map: false,

    // Caisse actes & soins
    mod_pos: true,
    mod_floor_plan: false,
    mod_kds: false,
    mod_pms: false,

    // Dossiers animaux, rdv & vaccins
    mod_reservations: true,
    mod_omnichannel: false,
    mod_customer: true,
    mod_quotes: true,
    mod_groups: false,

    // Pharmacie & dispositifs médicaux
    mod_kitchen_management: false,
    mod_bar: false,
    mod_storage_map: true,
    mod_inventory: true,
    mod_haccp: false,
    mod_quality_control: false,

    // Équipe vétérinaire & ASV
    mod_onboarding: true,
    mod_hr: true,
    mod_planning: true,
    mod_leaves: true,
    mod_recruitment: false,

    // Analytics & rappels
    mod_analytics: true,
    mod_google_analytics: false,
    mod_social_marketing: false,
    mod_ai_referencing: false,
    mod_seo: false,

    // Finance & comptabilité
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
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    logoUrl: '/brands/vet-logo.svg',
    borderRadius: '12px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'VETERINARY_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 20.0,
      'currency': 'EUR',
      'patient_records_enabled': true,
      'node_capacity': 50,
      'fiscal_coefficient': 1.0,
      'pmsEnabled': false,
    },
    economy: {
      basePrice: 129.0,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: 'Clinique Vétérinaire des Alisiers',
    version: '1.0.0-veterinary',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
