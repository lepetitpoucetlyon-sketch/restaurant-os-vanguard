import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

/**
 * 🗺️ Blueprint de la verticale RETAIL (Profil D — Retail & Variantes).
 */
export const RETAIL_BLUEPRINT: VerticalBlueprint = {
  slug: 'retail',
  className: 'RetailVertical',
  profile: 'D',
  meta: {
    emoji: '🛍️',
    label: 'Retail',
    name: 'Retail OS',
    description: 'Matrice de variantes (taille/couleur), scan douchette 2D, e-commerce sync, étiquettes prix',
  },
  capabilities: {
    mod_inventory: true,
    mod_storage_map: true,
    mod_omnichannel: true,
    mod_crm: true,
    mod_marketing: true,
    mod_social_marketing: true,
    mod_seo: true,
    mod_kiosk: true,
    mod_kds: false,
    mod_haccp: false,
    mod_floor_plan: false,
  },
  tokens: {
    appearance: 'dark',
    defaultTokens: {
      primaryColor: '#EC4899',
      primaryHover: '#DB2777',
      accentColor: '#F43F5E',
      borderRadiusCard: 'lg',
      borderRadiusBtn: 'lg',
      glassBlur: 'lg',
      glassOpacity: 'medium',
      fontBrand: 'Outfit',
      fontUI: 'Inter',
      fontMono: 'JetBrains Mono',
    },
    verticalTokens: {
      '--sku-in-stock': '#10B981',
      '--sku-low-stock': '#F59E0B',
      '--sku-out-of-stock': '#EF4444',
      '--scan-success': '#10B981',
    },
  },
  healthMetrics: { totalSkus: 'number', lowStockSkus: 'number' },
  routes: [
    { path: '/catalog/matrix', label: 'Matrice Variantes', componentPath: './commerce/VariantMatrixPage', componentExport: 'VariantMatrixPage' },
    { path: '/inventory/scan', label: 'Scan Douchette', componentPath: './logistics/BarcodeScanPage', componentExport: 'BarcodeScanPage' },
  ],
  events: [
    { name: 'retail.barcode_scanned', pillar: 'ops' },
    { name: 'retail.variant_stock_adjusted', pillar: 'logistics', durable: true },
    { name: 'retail.ecommerce_synced', pillar: 'commerce', durable: true },
  ],
  hardware: ['barcode_scanner', 'receipt_printer', 'cash_drawer', 'card_terminal', 'label_printer'],
  legalType: 'RETAIL',
  dnaOverrides: {
    layoutType: 'sidebar',
    metadataName: 'Retail Complete Matrix',
    businessLaws: { barcode_scanning_required: true, matrix_variants_enabled: true },
  },
  precision: 'L2',
  subVariants: [
    {
      slug: 'mode',
      label: 'Prêt-à-porter',
      description: 'Gestion collections saisons, retours cabine, programmes VIP.',
      capabilities: { mod_groups: true },
    },
  ],
};
