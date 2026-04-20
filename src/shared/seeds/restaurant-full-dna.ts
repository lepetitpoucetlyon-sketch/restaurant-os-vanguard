import { TenantConfig } from "@/shared/nexus-contract";

export const RESTAURANT_FULL_DNA: any = {
  id: 'restaurant_golden_seed_complete',
  capabilities: {
    // 1. Principal & Intelligence
    'mod_dashboard': true,
    'mod_executive_intelligence': true,
    'mod_system_map': true,
    
    // 2. Opérations
    'mod_pos': true,
    'mod_floor_plan': true,
    'mod_kds': true,
    
    // 3. Clients & Réservations (Customer)
    'mod_reservations': true,
    'mod_omnichannel': true,
    'mod_customer': true,
    'mod_quotes': true,
    'mod_groups': true,
    'mod_pms': true,
    
    // 4. Cuisine & Production
    'mod_kitchen_management': true,
    'mod_bar': true,
    'mod_storage_map': true,
    'mod_inventory': true,
    'mod_haccp': true,
    'mod_quality_control': true,
    
    // 5. Équipe & RH
    'mod_onboarding': true,
    'mod_hr': true,
    'mod_planning': true,
    'mod_leaves': true,
    'mod_recruitment': true,
    
    // 6. Analytics & Marketing (Growth)
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
    
    // 9. Administration & MCC
    'mod_settings': true,
    'mod_access_management': true,
    'mod_fleet_management': true,
    'mod_agent_dashboard': true
  },
  theme: {
    primaryColor: '#C5A059', // Classic Gold branding
    typography: 'sans',
    logoUrl: '/default-restaurant-logo.png'
  },
  status: {
    active: true,
    licenceStatus: 'active',
    lastSignalId: 'GOLDEN_SEED_V2_INIT',
    updatedAt: new Date().toISOString(),
    layoutType: 'sidebar',
    businessLaws: {
      'table_count': 50,
      'tax_rate': 10.0,
      'currency': 'EUR',
      'pmsEnabled': true
    },
    economy: {
      basePrice: 49.00,
      discountMultiplier: 1.0,
      billingStatus: 'active',
      currency: 'EUR'
    }
  },
  metadata: {
    name: 'Full Complete Matrix (34+ Modules)',
    ownerId: 'suzerain_root',
    createdAt: new Date().toISOString()
  }
};
