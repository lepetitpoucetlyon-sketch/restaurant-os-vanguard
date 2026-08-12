import { TenantConfig } from "@shared/nexus-contract";

/**
 * 🏢 Custom Vertical — DNA template générique
 * Utilisé quand variant = 'custom' (plateforme sans verticale prédéfinie).
 * Toutes les capabilities sont activables au cas par cas via MCC.
 */
export const CUSTOM_FULL_DNA: TenantConfig = {
  id: 'custom_golden_seed',
  tier: 'CLIENT' as const,
  variant: 'custom',
  capabilities: {
    // Dashboard
    'mod_dashboard': true,
    'mod_executive_intelligence': false,

    // Opérations de base
    'mod_pos': true,
    'mod_floor_plan': false,
    'mod_kds': false,

    // Clients
    'mod_reservations': false,
    'mod_customer': true,
    'mod_crm': false,
    'mod_quotes': false,
    'mod_groups': false,

    // Stock
    'mod_inventory': true,
    'mod_storage_map': false,

    // Ressources humaines
    'mod_hr': true,
    'mod_planning': false,
    'mod_leaves': false,
    'mod_timeclock': false,
    'mod_recruitment': false,

    // Finance
    'mod_treasury': true,
    'mod_accounting_management': false,
    'mod_registre': false,

    // Compliance
    'mod_haccp': false,
    'mod_quality_control': false,
    'mod_rgpd': true,

    // Marketing & Analytics
    'mod_analytics': false,
    'mod_marketing': false,
    'mod_social_marketing': false,

    // Intelligence
    'mod_ai': false,
    'mod_oracle': false,
  },
  theme: {
    primaryColor:   '#6366f1',
    secondaryColor: '#8B5CF6',
    logoUrl:        '',
    borderRadius:   '0.75rem',
    appearance:     'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch:      false,
    licenceStatus:   'TRIAL',
    layoutType:      'default',
    updatedAt:       Date.now(),
    economy: {
      basePrice:          0,
      currency:           'EUR',
      billingStatus:      'trial',
      discountMultiplier: 1,
    },
    businessLaws: {
      node_capacity:     1,
      fiscal_coefficient: 1,
      currency:          'EUR',
      pmsEnabled:        false,
    },
  },
  metadata: {
    name:              'Custom Instance',
    version:           '1.0.0',
    description:       'Plateforme custom — configuration sur mesure',
    ownerId:           '',
    createdAt:         Date.now(),
    subscriptionTier:  'TRIAL',
  },
};
