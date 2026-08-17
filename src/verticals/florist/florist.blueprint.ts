import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la future verticale FLORIST (Profil D — Retail & Variantes).
 */
export const FLORIST_BLUEPRINT: VerticalBlueprint = {
  slug: 'florist',
  className: 'FloristVertical',
  profile: 'D',
  meta: {
    emoji: '🌸',
    label: 'Fleuriste',
    name: 'Florist OS',
    description: 'Compositions florales, arrivages périssables, abonnements fleurs, livraisons mariages/deuils, caisse NF525',
  },
  capabilities: {
    mod_inventory: true,
    mod_storage_map: true,
    mod_omnichannel: true,
    mod_crm: true,
    mod_quotes: true,
    mod_marketing: true,
    mod_social_marketing: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
  },
  tokens: {
    appearance: 'light',
    defaultTokens: {
      primaryColor: '#10B981',
      primaryHover: '#059669',
      accentColor: '#F43F5E',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'md',
      glassOpacity: 'medium',
      fontBrand: 'Playfair Display',
      fontUI: 'Inter',
      fontMono: 'DM Mono',
    },
    verticalTokens: {
      '--flower-fresh': '#10B981',
      '--flower-wilting': '#F59E0B',
      '--delivery-pending': '#3B82F6',
    },
  },
  healthMetrics: { deliveriesToday: 'number', freshStemsInStock: 'number' },
  routes: [
    { path: '/arrangements', label: 'Compositions', componentPath: './ops/FloralArrangementsPage', componentExport: 'FloralArrangementsPage' },
    { path: '/deliveries', label: 'Tournées Livraison', componentPath: './logistics/FlowerDeliveriesPage', componentExport: 'FlowerDeliveriesPage' },
  ],
  events: [
    { name: 'florist.arrangement_created', pillar: 'ops', durable: true },
    { name: 'florist.perishable_stem_logged', pillar: 'logistics', durable: true },
    { name: 'florist.delivery_dispatched', pillar: 'logistics', durable: true },
  ],
  hardware: ['receipt_printer', 'card_terminal', 'barcode_scanner', 'label_printer'],
  legalType: 'FLORIST',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Florist Matrix',
    businessLaws: { botanical_perishability_enabled: true, event_delivery_workflow: true },
  },
  precision: 'L1',
  subVariants: [],
};
