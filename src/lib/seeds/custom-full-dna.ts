import { TenantConfig } from "@nexus/contracts/nexus-contract";

/**
 * 🏢 Custom Vertical — DNA template white-label
 *
 * Point de départ : cloné depuis _ref_custom (validé via _test_custom).
 * Particularité distinctive : white-labeling complet — le client "imprègne"
 * la plateforme de son identité visuelle (logo, charte graphique, couleurs).
 * Toutes les capabilities métier sont désactivées par défaut et activables
 * au cas par cas via MCC (FEATURE_FLAG).
 */
export const CUSTOM_FULL_DNA: TenantConfig = {
  id: 'custom_golden_seed',
  tier: 'CLIENT' as const,
  variant: 'custom',
  capabilities: {
    // Dashboard
    'mod_dashboard': true,
    'mod_executive_intelligence': false,

    // ── White-label — spécificité custom ─────────────────────────────────────
    // Le client configure son propre logo, couleurs primaire/secondaire,
    // typo et favicon. injectBrandingVars() lit ces tokens au runtime.
    'mod_white_label': true,
    'mod_custom_branding': true,
    'mod_settings': true,

    // Opérations de base (désactivé par défaut — à activer selon le métier)
    'mod_pos': false,
    'mod_floor_plan': false,
    'mod_kds': false,

    // Clients & agenda
    'mod_reservations': false,
    'mod_customer': true,
    'mod_crm': false,
    'mod_quotes': false,
    'mod_groups': false,

    // Stock
    'mod_inventory': false,
    'mod_storage_map': false,

    // RH
    'mod_hr': false,
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

    // Accès & flotte
    'mod_access_management': true,
    'mod_fleet_management': false,
    'mod_agent_dashboard': false,
  },
  features: {
    pos: false,
    kds: false,
    inventory: false,
    hr: false,
    reservations: false,
    finance: true,
    marketing: false,
  },
  theme: {
    // Tokens neutres — le client les remplace via mod_custom_branding
    primaryColor:   '#6366f1',
    secondaryColor: '#8B5CF6',
    logoUrl:        '',
    borderRadius:   '0.5rem',
    appearance:     'light',
  },
  status: {
    maintenanceMode: false,
    killSwitch:      false,
    licenceStatus:   'TRIAL',
    layoutType:      'default',
    lastSignalId:    'CUSTOM_SEED_V2_INIT',
    updatedAt:       Date.now(),
    economy: {
      basePrice:          0,
      currency:           'EUR',
      billingStatus:      'trial',
      discountMultiplier: 1,
    },
    businessLaws: {
      node_capacity:      1,
      fiscal_coefficient: 1,
      currency:           'EUR',
      pmsEnabled:         false,
    },
  },
  metadata: {
    name:             'Custom Instance',
    version:          '2.0.0',
    description:      'Plateforme white-label — configuration sur mesure via MCC',
    ownerId:          '',
    createdAt:        Date.now(),
    subscriptionTier: 'TRIAL',
  },
};
