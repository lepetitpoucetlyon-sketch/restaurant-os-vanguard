import { TenantConfig } from "@shared/nexus-contract";

export const HOTEL_FULL_DNA: TenantConfig = {
  id: 'hotel_golden_seed_complete',
  variant: 'hotel',
  capabilities: {
    // 1. Principal & Intelligence
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': true,

    // 2. Opérations — PMS centré, pas de KDS
    'mod_pos': true,
    'mod_floor_plan': true,
    'mod_kds': false,
    'mod_pms': true,

    // 3. Clients & Réservations
    'mod_reservations': true,
    'mod_omnichannel': true,
    'mod_customer': true,
    'mod_quotes': true,
    'mod_groups': true,

    // 4. Production — pas de cuisine/bar
    'mod_kitchen_management': false,
    'mod_bar': false,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': false,
    'mod_quality_control': false,

    // 5. Équipe & RH
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': true,

    // 6. Analytics & Marketing
    'mod_analytics': true,
    'mod_google_analytics': true,
    'mod_social_marketing': true,
    'mod_ai_referencing': true,
    'mod_seo': true,

    // 7. Finance & Comptabilité
    'mod_treasury': true,
    'mod_accounting_management': true,

    // 8. Légal & Registres
    'mod_registre': true,

    // 9. Administration
    'mod_settings': true,
    'mod_access_management': true,
    'mod_fleet_management': true,
    'mod_agent_dashboard': true
  },
  features: {
    pos: true,
    kds: false,
    inventory: true,
    hr: true,
    reservations: true,
    finance: true,
    marketing: true
  },
  theme: {
    primaryColor: '#1E3A5F',
    secondaryColor: '#2D5F8A',
    logoUrl: '/default-hotel-logo.svg',
    borderRadius: '8px',
    appearance: 'dark'
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: 'HOTEL_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: 'sidebar',
    businessLaws: {
      'room_count': 40,
      'tax_rate': 10.0,
      'currency': 'EUR',
      'pmsEnabled': true,
      'node_capacity': 300,
      'fiscal_coefficient': 1.0
    },
    economy: {
      basePrice: 89.00,
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR'
    }
  },
  metadata: {
    name: 'Hotel Complete Matrix',
    version: '1.0.0-hotel',
    ownerId: 'suzerain_root',
    createdAt: Date.now()
  }
};
