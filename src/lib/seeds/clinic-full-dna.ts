import { TenantConfig } from "@shared/nexus-contract";

export const CLINIC_FULL_DNA: TenantConfig = {
  id: 'clinic_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: 'clinic',
  capabilities: {
    'mod_dashboard': true,
    'mod_executive_intelligence': false,
    'mod_system_map': false,

    // Caisse + agenda médical
    'mod_pos': true,
    'mod_floor_plan': true,
    'mod_kds': false,
    'mod_pms': false,

    // Patients & rdv — cœur du métier
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
    'mod_quality_control': true,

    // Équipe médicale
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': false,

    // Analytics — conformité
    'mod_analytics': true,
    'mod_google_analytics': false,
    'mod_social_marketing': false,
    'mod_ai_referencing': false,
    'mod_seo': false,

    // Finance
    'mod_treasury': true,
    'mod_accounting_management': true,

    // Registres & RGPD — obligatoires santé
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
    primaryColor: '#3498DB',
    secondaryColor: '#1ABC9C',
    logoUrl: '/default-clinic-logo.svg',
    borderRadius: '8px',
    appearance: 'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'CLINIC_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'tax_rate': 0,
      'currency': 'EUR',
      'rgpd_strict': true,
      'appointments_required': true,
      'node_capacity': 30,
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
    name: 'Clinic Complete Matrix',
    version: '1.0.0-clinic',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
