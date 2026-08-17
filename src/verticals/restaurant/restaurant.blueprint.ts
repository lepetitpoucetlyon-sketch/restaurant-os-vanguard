import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale RESTAURANT (Profil A — Food & Périssable).
 */
export const RESTAURANT_BLUEPRINT: VerticalBlueprint = {
  slug: 'restaurant',
  className: 'RestaurantVertical',
  profile: 'A',
  meta: {
    emoji: '🍽️',
    label: 'Restaurant',
    name: 'Restaurant OS',
    description: 'Service en salle, plan de table, KDS multi-stations, HACCP, caisse NF525',
  },
  capabilities: {
    mod_floor_plan: true,
    mod_kds: true,
    mod_kitchen_management: true,
    mod_haccp: true,
    mod_hygiene: true,
    mod_quality_control: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_reservations: true,
    mod_marketing: true,
    mod_pms: false,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#6366f1',
      primaryHover: '#4f46e5',
      accentColor: '#8b5cf6',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Inter',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--table-available': '#10b981',
      '--table-occupied': '#6366f1',
      '--table-reserved': '#f59e0b',
      '--table-bill-printed': '#3b82f6',
      '--course-order-sent': '#8b5cf6',
      '--course-next-fired': '#ec4899',
    },
  },
  healthMetrics: { tablesActive: 'number', coversToday: 'number' },
  routes: [
    { path: '/pos', label: 'Caisse POS', componentPath: './ops/POSPage', componentExport: 'POSPage' },
    { path: '/kds', label: 'KDS Cuisine', componentPath: './ops/KDSPage', componentExport: 'KDSPage' },
    { path: '/floor-plan', label: 'Plan de Salle', componentPath: './facility/FloorPlanPage', componentExport: 'FloorPlanPage' },
  ],
  events: [
    { name: 'restaurant.order_sent_to_kitchen', pillar: 'ops', durable: true },
    { name: 'restaurant.table_status_changed', pillar: 'ops', durable: true },
    { name: 'restaurant.course_next_fired', pillar: 'ops', durable: true },
    { name: 'restaurant.bill_split_requested', pillar: 'ops' },
  ],
  hardware: ['receipt_printer', 'kitchen_printer', 'cash_drawer', 'card_terminal', 'barcode_scanner'],
  legalType: 'RESTAURANT',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Restaurant Complete Matrix',
    businessLaws: { table_service_enabled: true, kds_routing_enabled: true },
  },
  precision: 'L3',
  subVariants: [
    {
      slug: 'brasserie',
      label: 'Brasserie',
      description: 'Débit élevé, service continu, rush intense.',
      capabilities: { mod_kiosk: true },
    },
    {
      slug: 'gastronomique',
      label: 'Gastronomique',
      description: 'Accords mets-vins, réservations avec arrhes, coursing multi-étapes.',
      capabilities: { mod_quotes: true },
    },
  ],
};
