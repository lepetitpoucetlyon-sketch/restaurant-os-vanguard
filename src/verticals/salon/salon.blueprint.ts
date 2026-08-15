import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale SALON (profil B — Rendez-vous & Espace).
 *
 * Décrit de façon déclarative ce que le générateur produit et ce que la verticale
 * réelle implémente. Sert de PREUVE : `generateVertical(SALON_BLUEPRINT)` doit
 * reproduire la structure L1 (adapters via factories, plugin, tokens, DNA) qui a
 * été migrée à la main dans src/verticals/salon/.
 *
 * Démontre aussi les SOUS-VARIANTES (barbier, spa) : deltas sur la base, zéro copie.
 */
export const SALON_BLUEPRINT: VerticalBlueprint = {
  slug: 'salon',
  className: 'SalonVertical',
  profile: 'B',
  meta: {
    emoji: '✂️',
    label: 'Salon',
    name: 'Salon OS',
    description: 'Agenda stylistes, produits cabine, fidélité, caisse NF525',
  },
  // Overrides sur le socle du profil B (déjà : reservations, crm, quotes, inventory,
  // storage_map, marketing, social_marketing, leaves + socle universel).
  capabilities: {
    mod_executive_intelligence: true,
    mod_access_management: true,
    mod_treasury: true,
    mod_accounting_management: true,
    mod_kds: false,
    mod_floor_plan: false,
    mod_pms: false,
    mod_haccp: false,
    mod_registre: false,
  },
  tokens: {
    appearance: 'light',
    defaultTokens: {
      primaryColor: '#D4A5C7',
      primaryHover: '#C490B8',
      accentColor: '#9B59B6',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Cormorant Garamond',
      fontUI: 'DM Sans',
      fontMono: 'DM Mono',
    },
    verticalTokens: {
      '--appointment-booked': '#D4A5C7',
      '--appointment-in-progress': '#9B59B6',
      '--appointment-completed': '#10b981',
      '--appointment-cancelled': '#ef4444',
      '--appointment-no-show': '#f59e0b',
      '--chair-available': '#10b981',
      '--chair-occupied': '#D4A5C7',
      '--chair-break': '#9ca3af',
      '--vertical-accent-muted': 'rgba(212, 165, 199, 0.15)',
    },
  },
  healthMetrics: { chairsActive: 'number', appointmentsToday: 'number' },
  routes: [
    { path: '/agenda', label: 'Agenda', componentPath: './commerce/AppointmentCalendar', componentExport: 'AppointmentCalendar' },
    { path: '/stylists', label: 'Stylistes', componentPath: './human/StylistDashboard', componentExport: 'StylistDashboard' },
    { path: '/cabin-stock', label: 'Stock cabine', componentPath: './logistics/CabinStockPage', componentExport: 'CabinStockPage' },
  ],
  events: [
    { name: 'salon.appointment_completed', pillar: 'ops', durable: true },
    { name: 'salon.no_show', pillar: 'ops', durable: true },
    { name: 'salon.appointment_booked', pillar: 'commerce', durable: true },
    { name: 'salon.appointment_cancelled', pillar: 'commerce', durable: true },
    { name: 'salon.loyalty_earned', pillar: 'commerce' },
    { name: 'salon.stylist_assigned', pillar: 'human' },
    { name: 'salon.chair_metrics_snapshot', pillar: 'intelligence' },
    { name: 'salon.product_consumed', pillar: 'logistics' },
  ],
  hardware: ['receipt_printer', 'cash_drawer', 'card_terminal', 'barcode_scanner'],
  legalType: 'SALON',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Salon Complete Matrix',
    businessLaws: { appointments_enabled: true, node_capacity: 50 },
  },
  precision: 'L1',
  subVariants: [
    {
      slug: 'barbier',
      label: 'Barbier',
      description: 'Barbershop : coupe & rasage, walk-in fréquent, moins de devis.',
      capabilities: { mod_quotes: false },
      dnaOverrides: { metadataName: 'Barbershop Matrix' },
    },
    {
      slug: 'spa',
      label: 'Spa & Bien-être',
      description: 'Spa : cures multi-séances, cabines, forte revente de produits.',
      capabilities: { mod_groups: true },
      verticalTokens: { '--vertical-accent-muted': 'rgba(155, 89, 182, 0.15)' },
    },
  ],
};
