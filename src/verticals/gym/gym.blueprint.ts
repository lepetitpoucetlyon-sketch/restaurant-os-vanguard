import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la future verticale GYM (Profil G — Accès & Abonnements).
 */
export const GYM_BLUEPRINT: VerticalBlueprint = {
  slug: 'gym',
  className: 'GymVertical',
  profile: 'G',
  meta: {
    emoji: '🏋️',
    label: 'Salle de Sport',
    name: 'Fitness OS',
    description: 'Abonnements SEPA récurrents, contrôle d\'accès RFID, cours collectifs, coaching, caisse NF525',
  },
  capabilities: {
    mod_reservations: true,
    mod_crm: true,
    mod_inventory: true,
    mod_marketing: true,
    mod_social_marketing: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
    mod_pms: false,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#EF4444',
      primaryHover: '#DC2626',
      accentColor: '#F97316',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'high',
      fontBrand: 'Impact',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--turnstile-granted': '#10B981',
      '--turnstile-denied': '#EF4444',
      '--member-active': '#10B981',
      '--member-frozen': '#3B82F6',
      '--member-expired': '#9CA3AF',
    },
  },
  healthMetrics: { activeMembers: 'number', currentTurnstileEntries: 'number' },
  routes: [
    { path: '/members', label: 'Membres & Abonnements', componentPath: './commerce/MembersDashboard', componentExport: 'MembersDashboard' },
    { path: '/classes', label: 'Planning Cours', componentPath: './ops/ClassSchedulePage', componentExport: 'ClassSchedulePage' },
  ],
  events: [
    { name: 'gym.turnstile_scanned', pillar: 'ops', durable: true },
    { name: 'gym.subscription_renewed', pillar: 'finance', durable: true },
    { name: 'gym.class_booked', pillar: 'commerce', durable: true },
  ],
  hardware: ['turnstile', 'rfid_reader', 'receipt_printer', 'card_terminal'],
  legalType: 'FITNESS',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Gym Fitness Matrix',
    businessLaws: { sepa_direct_debit_enabled: true, turnstile_access_control: true },
  },
  precision: 'L1',
  subVariants: [
    {
      slug: 'crossfit',
      label: 'Box CrossFit',
      description: 'WOD journalier, gestion de drops-in, matériel lourd.',
      capabilities: { mod_groups: true },
    },
  ],
};
