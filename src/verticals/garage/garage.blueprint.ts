import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale GARAGE (Profil C — Atelier & Technique).
 */
export const GARAGE_BLUEPRINT: VerticalBlueprint = {
  slug: 'garage',
  className: 'GarageVertical',
  profile: 'C',
  meta: {
    emoji: '🔧',
    label: 'Garage',
    name: 'Garage OS',
    description: 'Ordres de réparation (OR), immatriculation SIV, pièces TecDoc, devis, caisse NF525',
  },
  capabilities: {
    mod_reservations: true,
    mod_quotes: true,
    mod_inventory: true,
    mod_storage_map: true,
    mod_crm: true,
    mod_registre: true,
    mod_kds: false,
    mod_haccp: false,
    mod_pms: false,
    mod_floor_plan: false,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#EA580C',
      primaryHover: '#C2410C',
      accentColor: '#F97316',
      borderRadiusCard: 'md',
      borderRadiusBtn: 'md',
      glassBlur: 'md',
      glassOpacity: 'high',
      fontBrand: 'Oswald',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--lift-available': '#10B981',
      '--lift-occupied': '#EA580C',
      '--or-draft': '#9CA3AF',
      '--or-in-progress': '#F97316',
      '--or-completed': '#10B981',
    },
  },
  healthMetrics: { baysActive: 'number', openRepairOrders: 'number' },
  routes: [
    { path: '/workshop', label: 'Atelier', componentPath: './ops/WorkshopPlanningPage', componentExport: 'WorkshopPlanningPage' },
    { path: '/repair-orders', label: 'Ordres de Réparation', componentPath: './ops/RepairOrdersPage', componentExport: 'RepairOrdersPage' },
    { path: '/parts-catalog', label: 'Catalogue Pièces', componentPath: './logistics/PartsCatalogPage', componentExport: 'PartsCatalogPage' },
  ],
  events: [
    { name: 'garage.repair_order_created', pillar: 'ops', durable: true },
    { name: 'garage.repair_order_completed', pillar: 'ops', durable: true },
    { name: 'garage.vehicle_siv_inspected', pillar: 'ops' },
    { name: 'garage.part_ordered', pillar: 'logistics', durable: true },
  ],
  hardware: ['receipt_printer', 'barcode_scanner', 'card_terminal'],
  legalType: 'GARAGE',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Garage Complete Matrix',
    businessLaws: { vehicle_registration_required: true, repair_order_workflow: true },
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'carrosserie',
      label: 'Carrosserie & Peinture',
      description: 'Gestion expertise assurance, chiffrage pièces, cabine de peinture.',
      capabilities: { mod_quotes: true },
    },
  ],
};
